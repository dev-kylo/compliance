import { getResearcher } from "@/lib/data/researchers";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { ValidationResults } from "@/components/validation-results";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { runValidation } from "@/lib/calculations";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import Link from "next/link";

export default async function ResearcherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const researcher = await getResearcher(id);

  if (!researcher) {
    notFound();
  }

  // Prepare grants with funded FTE for this researcher
  const grants = researcher.grantAllocations.map((ga) => ({
    ...ga.grant,
    fundedFTE: ga.fundedFTE,
  }));

  // Run validation on the latest period (first in the list, sorted desc)
  const latestPeriod = researcher.timesheetPeriods[0] ?? null;
  let validationResults: ReturnType<typeof runValidation> = [];
  if (latestPeriod) {
    validationResults = runValidation(
      latestPeriod,
      researcher,
      grants,
      researcher.timesheetPeriods
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/researchers"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Researchers
      </Link>

      {/* Researcher Info Header */}
      <Card>
        <CardHeader>
          <CardTitle>{researcher.name}</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Department</p>
            <p className="font-medium text-foreground">{researcher.department}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Annual Salary</p>
            <p className="font-medium text-foreground">
              {formatCurrency(researcher.annualSalary)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Contracted Hours</p>
            <p className="font-medium text-foreground">
              {researcher.contractedHoursWeekly}h / week
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Employment Fraction</p>
            <p className="font-medium text-foreground">
              {(researcher.employmentFraction * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Active Grants */}
      <Card>
        <CardHeader>
          <CardTitle>Active Grants</CardTitle>
        </CardHeader>
        {grants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No grants allocated to this researcher.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Reference</th>
                  <th className="pb-3 pr-4 font-medium">Title</th>
                  <th className="pb-3 pr-4 font-medium text-right">Funded FTE</th>
                  <th className="pb-3 pr-4 font-medium text-right">Staff Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grants.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/50">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/grants/${g.id}`}
                        className="font-mono text-sm font-medium text-foreground hover:underline"
                      >
                        {g.reference}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-foreground">{g.title}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {g.fundedFTE.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatCurrency(g.totalStaffBudget)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Timesheet History */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheet History</CardTitle>
        </CardHeader>
        {researcher.timesheetPeriods.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No timesheet periods recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Period</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium text-right">Grant Hours</th>
                  <th className="pb-3 pr-4 font-medium text-right">Non-Grant Hours</th>
                  <th className="pb-3 pr-4 font-medium text-right">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {researcher.timesheetPeriods.map((period) => {
                  const grantHours = period.entries.reduce(
                    (sum, e) => sum + e.hours,
                    0
                  );
                  const nonGrantHours = (period.nonGrantEntries ?? []).reduce(
                    (sum, e) => sum + e.hours,
                    0
                  );
                  const totalHours = grantHours + nonGrantHours;

                  return (
                    <tr key={period.id} className="hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium">
                        {formatMonthYear(period.year, period.month)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={period.status} />
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {grantHours.toFixed(1)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {nonGrantHours.toFixed(1)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums font-medium">
                        {totalHours.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Validation Results for Latest Period */}
      <Card>
        <CardHeader>
          <CardTitle>
            Validation Results
            {latestPeriod && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({formatMonthYear(latestPeriod.year, latestPeriod.month)})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {latestPeriod ? (
          <ValidationResults results={validationResults} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No timesheet periods to validate.
          </p>
        )}
      </Card>
    </div>
  );
}
