import { getGrant } from "@/lib/data/grants";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculationWorkings } from "@/components/calculation-workings";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatMonthYear, formatPercentage } from "@/lib/utils";
import { runCalculation } from "@/lib/calculations";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function GrantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const grant = await getGrant(id);

  if (!grant) {
    notFound();
  }

  const now = new Date();
  const isActive = now >= new Date(grant.startDate) && now <= new Date(grant.endDate);
  const funderLabel = grant.funderProfileId === "ukri" ? "UKRI" : grant.funderProfileId;

  // Get researcher IDs from grant allocations
  const researcherIds = grant.grantAllocations.map((ga) => ga.researcherId);

  // Fetch timesheet periods for researchers on this grant that have entries for this grant
  const periods = await prisma.timesheetPeriod.findMany({
    where: {
      researcherId: { in: researcherIds },
      entries: { some: { grantId: grant.id } },
    },
    include: { entries: true, nonGrantEntries: true, researcher: true },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  // Build allocation lookup: researcherId -> fundedFTE
  const allocationMap = new Map(
    grant.grantAllocations.map((ga) => [ga.researcherId, ga.fundedFTE])
  );

  // Run calculations for each period
  const calculationsByResearcher = new Map<
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

    if (!calculationsByResearcher.has(period.researcherId)) {
      calculationsByResearcher.set(period.researcherId, {
        researcher: period.researcher,
        months: [],
        totalClaimable: 0,
      });
    }

    const entry = calculationsByResearcher.get(period.researcherId)!;
    entry.months.push({
      year: period.year,
      month: period.month,
      hours: grantEntry.hours,
      result,
    });
    entry.totalClaimable += result.claimableCost;
  }

  // Grand total
  const grandTotalClaimable = Array.from(calculationsByResearcher.values()).reduce(
    (sum, r) => sum + r.totalClaimable,
    0
  );

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/grants"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Grants
      </Link>

      {/* Grant Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{grant.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{grant.reference}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">{funderLabel}</Badge>
              {isActive ? (
                <Badge variant="success">Active</Badge>
              ) : now > new Date(grant.endDate) ? (
                <Badge variant="error">Ended</Badge>
              ) : (
                <Badge variant="warning">Not Started</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Start Date</p>
            <p className="mt-1 text-sm font-medium">{formatDate(grant.startDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">End Date</p>
            <p className="mt-1 text-sm font-medium">{formatDate(grant.endDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Staff Budget</p>
            <p className="mt-1 text-sm font-medium font-mono">{formatCurrency(grant.totalStaffBudget)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Principal Investigator</p>
            <p className="mt-1 text-sm font-medium">{grant.principalInvestigator.name}</p>
          </div>
        </div>
      </Card>

      {/* Researchers on Grant */}
      <Card>
        <CardHeader>
          <CardTitle>Researchers ({grant.grantAllocations.length})</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Department</th>
                <th className="pb-3 pr-4 font-medium text-right">Funded FTE</th>
                <th className="pb-3 pr-4 font-medium text-right">Employment Fraction</th>
                <th className="pb-3 pr-4 font-medium text-right">Annual Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grant.grantAllocations.map((ga) => (
                <tr key={ga.id} className="hover:bg-muted/50">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/researchers/${ga.researcher.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {ga.researcher.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {ga.researcher.department}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatPercentage(ga.fundedFTE)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatPercentage(ga.researcher.employmentFraction)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatCurrency(ga.researcher.annualSalary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Monthly Calculation Results */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Calculations</CardTitle>
        </CardHeader>

        {calculationsByResearcher.size === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-muted-foreground">
            No timesheet data available for this grant yet.
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(calculationsByResearcher.entries()).map(
              ([researcherId, data]) => (
                <div key={researcherId} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="font-semibold text-foreground">
                      {data.researcher.name}
                    </h4>
                    <span className="text-sm font-medium text-muted-foreground">
                      Total: {formatCurrency(data.totalClaimable)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4 font-medium">Period</th>
                          <th className="pb-2 pr-4 font-medium text-right">Hours</th>
                          <th className="pb-2 pr-4 font-medium text-right">Effort %</th>
                          <th className="pb-2 pr-4 font-medium text-right">Monthly Salary</th>
                          <th className="pb-2 pr-4 font-medium text-right">Salary Charged</th>
                          <th className="pb-2 pr-4 font-medium text-right">Claimable</th>
                          <th className="pb-2 font-medium">Workings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.months.map((m) => (
                          <tr key={`${m.year}-${m.month}`} className="hover:bg-muted/50">
                            <td className="py-3 pr-4 font-medium">
                              {formatMonthYear(m.year, m.month)}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono">
                              {m.hours.toFixed(1)}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono">
                              {formatPercentage(m.result.effortPercentage)}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono">
                              {formatCurrency(m.result.monthlySalary)}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono">
                              {formatCurrency(m.result.salaryCostCharged)}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono font-semibold">
                              {formatCurrency(m.result.claimableCost)}
                            </td>
                            <td className="py-3 min-w-[280px]">
                              <CalculationWorkings
                                workings={m.result.workings}
                                claimableCost={m.result.claimableCost}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Total Staff Budget
            </p>
            <p className="mt-2 text-2xl font-bold font-mono">
              {formatCurrency(grant.totalStaffBudget)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Total Claimable Cost
            </p>
            <p className="mt-2 text-2xl font-bold font-mono">
              {formatCurrency(grandTotalClaimable)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Budget Used
            </p>
            <p
              className={`mt-2 text-2xl font-bold font-mono ${
                grandTotalClaimable > grant.totalStaffBudget
                  ? "text-red-600"
                  : "text-foreground"
              }`}
            >
              {grant.totalStaffBudget > 0
                ? formatPercentage(grandTotalClaimable / grant.totalStaffBudget)
                : "N/A"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Remaining: {formatCurrency(grant.totalStaffBudget - grandTotalClaimable)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
