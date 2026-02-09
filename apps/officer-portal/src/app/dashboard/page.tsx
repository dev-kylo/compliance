import { getDashboardData } from "@/lib/data/dashboard";
import { runValidation } from "@/lib/calculations";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMonthYear, getSeverityColor, daysOverdue } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { targetMonth, targetYear, researchers } = data;

  // --- Risk Flags: run validation on each researcher's latest period for the target month ---
  const allFlags: {
    researcherName: string;
    researcherId: string;
    ruleId: string;
    ruleName: string;
    severity: string;
    message: string;
  }[] = [];

  for (const researcher of researchers) {
    const targetPeriod = researcher.timesheetPeriods.find(
      (p) => p.year === targetYear && p.month === targetMonth
    );
    if (!targetPeriod) continue;

    const grants = researcher.grantAllocations.map((ga) => ({
      ...ga.grant,
      fundedFTE: ga.fundedFTE,
    }));

    const results = runValidation(
      targetPeriod,
      researcher,
      grants,
      researcher.timesheetPeriods
    );

    for (const result of results) {
      if (!result.passed) {
        allFlags.push({
          researcherName: researcher.name,
          researcherId: researcher.id,
          ruleId: result.ruleId,
          ruleName: result.ruleName,
          severity: result.severity,
          message: result.message,
        });
      }
    }
  }

  // Sort: errors first, then warnings, then info
  const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };
  allFlags.sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );

  // --- Outstanding Actions: submitted awaiting signature + overdue drafts ---
  const DEADLINE_DAYS = 10;

  const awaitingSignature = data.overduePeriods.filter(
    (p) => p.status === "SUBMITTED"
  );
  const overdueDrafts = data.overduePeriods.filter(
    (p) => p.status === "DRAFT" && daysOverdue(p.year, p.month, DEADLINE_DAYS) > 0
  );

  const outstandingActions = [
    ...awaitingSignature.map((p) => ({
      id: p.id,
      researcherName: p.researcher.name,
      researcherId: p.researcherId,
      year: p.year,
      month: p.month,
      status: p.status,
      overdueDays: daysOverdue(p.year, p.month, DEADLINE_DAYS),
    })),
    ...overdueDrafts.map((p) => ({
      id: p.id,
      researcherName: p.researcher.name,
      researcherId: p.researcherId,
      year: p.year,
      month: p.month,
      status: p.status,
      overdueDays: daysOverdue(p.year, p.month, DEADLINE_DAYS),
    })),
  ].sort((a, b) => b.overdueDays - a.overdueDays);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Compliance Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Target period: {formatMonthYear(targetYear, targetMonth)}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Researchers"
          value={data.totalResearchers}
          variant="default"
        />
        <StatCard
          title="Submitted"
          value={data.submittedCount}
          subtitle={`of ${data.totalResearchers} for ${formatMonthYear(targetYear, targetMonth)}`}
          variant="success"
        />
        <StatCard
          title="Unsigned"
          value={data.unsignedCount}
          subtitle="Awaiting PI signature"
          variant="warning"
        />
        <StatCard
          title="Locked"
          value={data.lockedCount}
          subtitle="Fully processed"
          variant="success"
        />
      </div>

      {/* Risk Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Flags</CardTitle>
        </CardHeader>
        {allFlags.length === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-800">
              No validation issues found for {formatMonthYear(targetYear, targetMonth)}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allFlags.map((flag, idx) => (
              <div
                key={`${flag.researcherId}-${flag.ruleId}-${idx}`}
                className={`flex items-start gap-3 rounded-lg border p-4 ${getSeverityColor(flag.severity)}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded px-2 py-0.5 text-xs font-semibold uppercase">
                      {flag.severity}
                    </span>
                    <span className="text-sm font-medium">{flag.ruleName}</span>
                  </div>
                  <p className="mt-1 text-sm">{flag.message}</p>
                  <Link
                    href={`/researchers/${flag.researcherId}`}
                    className="mt-1 inline-block text-xs font-medium underline"
                  >
                    {flag.researcherName}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Outstanding Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Actions</CardTitle>
        </CardHeader>
        {outstandingActions.length === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-800">
              No outstanding actions. All timesheets are up to date.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Researcher</th>
                  <th className="pb-3 pr-4 font-medium">Period</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {outstandingActions.map((action) => (
                  <tr key={action.id} className="hover:bg-muted/50">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/researchers/${action.researcherId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {action.researcherName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      {formatMonthYear(action.year, action.month)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={action.status} />
                    </td>
                    <td className="py-3 pr-4">
                      {action.overdueDays > 0 ? (
                        <span className="font-semibold text-red-600">
                          {action.overdueDays} day{action.overdueDays !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
