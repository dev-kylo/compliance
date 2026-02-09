import { getGrants } from "@/lib/data/grants";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalculationWorkings } from "@/components/calculation-workings";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatMonthYear, formatPercentage } from "@/lib/utils";
import { runCalculation } from "@/lib/calculations";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function CalculationsPage() {
  const grants = await getGrants();

  // For each grant, fetch periods and run calculations
  const grantCalculations = await Promise.all(
    grants.map(async (grant) => {
      const periods = await prisma.timesheetPeriod.findMany({
        where: { entries: { some: { grantId: grant.id } } },
        include: { entries: true, nonGrantEntries: true, researcher: true },
        orderBy: [{ year: "asc" }, { month: "asc" }],
      });

      // Build allocation lookup
      const allocationMap = new Map(
        grant.grantAllocations.map((ga) => [ga.researcherId, ga.fundedFTE])
      );

      // Run calculations grouped by researcher
      const byResearcher = new Map<
        string,
        {
          researcher: (typeof periods)[0]["researcher"];
          months: {
            year: number;
            month: number;
            hours: number;
            result: ReturnType<typeof runCalculation>;
          }[];
          totalClaimable: number;
        }
      >();

      for (const period of periods) {
        const fundedFTE = allocationMap.get(period.researcherId) ?? 0;
        const grantEntry = period.entries.find((e) => e.grantId === grant.id);
        if (!grantEntry) continue;

        const result = runCalculation(period, period.researcher, grant, fundedFTE);

        if (!byResearcher.has(period.researcherId)) {
          byResearcher.set(period.researcherId, {
            researcher: period.researcher,
            months: [],
            totalClaimable: 0,
          });
        }

        const entry = byResearcher.get(period.researcherId)!;
        entry.months.push({
          year: period.year,
          month: period.month,
          hours: grantEntry.hours,
          result,
        });
        entry.totalClaimable += result.claimableCost;
      }

      const grantTotal = Array.from(byResearcher.values()).reduce(
        (sum, r) => sum + r.totalClaimable,
        0
      );

      return {
        grant,
        byResearcher,
        grantTotal,
      };
    })
  );

  // Overall totals
  const overallTotalClaimed = grantCalculations.reduce(
    (sum, gc) => sum + gc.grantTotal,
    0
  );
  const overallTotalBudget = grantCalculations.reduce(
    (sum, gc) => sum + gc.grant.totalStaffBudget,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calculations</h1>
        <p className="mt-1 text-muted-foreground">
          UKRI salary cost calculations for all grants and researchers
        </p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Budget (All Grants)
          </p>
          <p className="mt-2 text-2xl font-bold font-mono">
            {formatCurrency(overallTotalBudget)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Claimable (All Grants)
          </p>
          <p className="mt-2 text-2xl font-bold font-mono">
            {formatCurrency(overallTotalClaimed)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Overall Budget Used
          </p>
          <p
            className={`mt-2 text-2xl font-bold font-mono ${
              overallTotalClaimed > overallTotalBudget
                ? "text-red-600"
                : "text-foreground"
            }`}
          >
            {overallTotalBudget > 0
              ? formatPercentage(overallTotalClaimed / overallTotalBudget)
              : "N/A"}
          </p>
        </Card>
      </div>

      {/* Per-Grant Calculations */}
      {grantCalculations.map(({ grant, byResearcher, grantTotal }) => (
        <Card key={grant.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>
                  <Link
                    href={`/grants/${grant.id}`}
                    className="hover:underline"
                  >
                    {grant.reference}
                  </Link>
                </CardTitle>
                <CardDescription>{grant.title}</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Claimed</p>
                  <p className="font-mono font-semibold">
                    {formatCurrency(grantTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-mono font-semibold">
                    {formatCurrency(grant.totalStaffBudget)}
                  </p>
                </div>
                <Badge
                  variant={
                    grantTotal > grant.totalStaffBudget
                      ? "error"
                      : grantTotal > grant.totalStaffBudget * 0.9
                        ? "warning"
                        : "success"
                  }
                >
                  {grant.totalStaffBudget > 0
                    ? formatPercentage(grantTotal / grant.totalStaffBudget)
                    : "N/A"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          {byResearcher.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              No timesheet data available for this grant.
            </p>
          ) : (
            <div className="space-y-6">
              {Array.from(byResearcher.entries()).map(
                ([researcherId, data]) => (
                  <div key={researcherId} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/researchers/${researcherId}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {data.researcher.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {data.researcher.department}
                        </span>
                      </div>
                      <span className="text-sm font-mono font-semibold">
                        {formatCurrency(data.totalClaimable)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {data.months.map((m) => (
                        <div
                          key={`${m.year}-${m.month}`}
                          className="rounded-lg border border-border"
                        >
                          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                            <span className="text-sm font-medium">
                              {formatMonthYear(m.year, m.month)}
                            </span>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                Hours: <span className="font-mono font-medium text-foreground">{m.hours.toFixed(1)}</span>
                              </span>
                              <span>
                                Effort: <span className="font-mono font-medium text-foreground">{formatPercentage(m.result.effortPercentage)}</span>
                              </span>
                              <span>
                                Salary Charged: <span className="font-mono font-medium text-foreground">{formatCurrency(m.result.salaryCostCharged)}</span>
                              </span>
                              {m.result.warnings.length > 0 && (
                                <Badge variant="warning">
                                  {m.result.warnings.length} warning{m.result.warnings.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="p-0">
                            <CalculationWorkings
                              workings={m.result.workings}
                              claimableCost={m.result.claimableCost}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Grant totals row */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm font-semibold text-foreground">
                  Grant Total
                </span>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Claimable: </span>
                    <span className="font-mono font-bold">
                      {formatCurrency(grantTotal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining: </span>
                    <span
                      className={`font-mono font-bold ${
                        grant.totalStaffBudget - grantTotal < 0
                          ? "text-red-600"
                          : "text-foreground"
                      }`}
                    >
                      {formatCurrency(grant.totalStaffBudget - grantTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}

      {grantCalculations.length === 0 && (
        <Card>
          <div className="p-8 text-center text-muted-foreground">
            No grants found. Calculations will appear here once grants are created.
          </div>
        </Card>
      )}
    </div>
  );
}
