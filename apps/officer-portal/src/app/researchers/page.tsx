import { getResearchers } from "@/lib/data/researchers";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ResearchersPage() {
  const researchers = await getResearchers();

  // Calculate compliance status for each researcher.
  // Look at the last 6 months of timesheet periods.
  const now = new Date();
  const last6Months: { year: number; month: number }[] = [];
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const researcherRows = researchers.map((r) => {
    const activeGrants = r.grantAllocations.length;

    // Check compliance over last 6 months
    let pendingCount = 0;
    let missingCount = 0;

    for (const monthDef of last6Months) {
      const period = r.timesheetPeriods.find(
        (p) => p.year === monthDef.year && p.month === monthDef.month
      );
      if (!period) {
        missingCount++;
      } else if (period.status !== "LOCKED") {
        pendingCount++;
      }
    }

    let complianceStatus: "success" | "warning" | "error";
    let complianceLabel: string;
    if (missingCount > 0) {
      complianceStatus = "error";
      complianceLabel = `${missingCount} missing`;
    } else if (pendingCount > 0) {
      complianceStatus = "warning";
      complianceLabel = `${pendingCount} pending`;
    } else {
      complianceStatus = "success";
      complianceLabel = "All locked";
    }

    return {
      id: r.id,
      name: r.name,
      department: r.department,
      contractedHours: r.contractedHoursWeekly,
      employmentFraction: r.employmentFraction,
      activeGrants,
      complianceStatus,
      complianceLabel,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Researchers</h1>
        <p className="mt-1 text-muted-foreground">
          {researchers.length} researcher{researchers.length !== 1 ? "s" : ""} registered
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium text-right">Contracted Hours</th>
              <th className="px-4 py-3 font-medium text-right">Employment FTE</th>
              <th className="px-4 py-3 font-medium text-right">Active Grants</th>
              <th className="px-4 py-3 font-medium">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {researcherRows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/researchers/${r.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.department}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.contractedHours}h/week
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {(r.employmentFraction * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{r.activeGrants}</td>
                <td className="px-4 py-3">
                  <Badge variant={r.complianceStatus}>{r.complianceLabel}</Badge>
                </td>
              </tr>
            ))}
            {researcherRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No researchers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
