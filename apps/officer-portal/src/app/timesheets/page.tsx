import { getResearchers } from "@/lib/data/researchers";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMonthYear, daysOverdue } from "@/lib/utils";
import Link from "next/link";

// Generate the last 6 months ending at Feb 2026
function getLast6Months(): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  // Sep 2025 through Feb 2026
  let year = 2026;
  let month = 2; // February
  for (let i = 0; i < 6; i++) {
    months.unshift({ year, month });
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
  }
  return months;
}

const DEADLINE_DAYS = 10;

export default async function TimesheetsPage() {
  const researchers = await getResearchers();
  const months = getLast6Months();

  // Build matrix: for each researcher, for each month, find the matching timesheet period
  const matrix = researchers.map((researcher) => {
    const cells = months.map((m) => {
      const period = researcher.timesheetPeriods.find(
        (p) => p.year === m.year && p.month === m.month
      );
      return {
        year: m.year,
        month: m.month,
        status: period ? period.status.toLowerCase() : "missing",
        periodId: period?.id ?? null,
      };
    });
    return {
      researcher,
      cells,
    };
  });

  // Actions needed: timesheets that need attention
  const actionsNeeded: {
    researcherName: string;
    researcherId: string;
    year: number;
    month: number;
    status: string;
    overdueDays: number;
    action: string;
  }[] = [];

  for (const row of matrix) {
    for (const cell of row.cells) {
      if (cell.status === "missing") {
        const overdue = daysOverdue(cell.year, cell.month, DEADLINE_DAYS);
        if (overdue > 0) {
          actionsNeeded.push({
            researcherName: row.researcher.name,
            researcherId: row.researcher.id,
            year: cell.year,
            month: cell.month,
            status: cell.status,
            overdueDays: overdue,
            action: "Timesheet not created",
          });
        }
      } else if (cell.status === "draft") {
        const overdue = daysOverdue(cell.year, cell.month, DEADLINE_DAYS);
        if (overdue > 0) {
          actionsNeeded.push({
            researcherName: row.researcher.name,
            researcherId: row.researcher.id,
            year: cell.year,
            month: cell.month,
            status: cell.status,
            overdueDays: overdue,
            action: "Not yet submitted",
          });
        }
      } else if (cell.status === "submitted") {
        actionsNeeded.push({
          researcherName: row.researcher.name,
          researcherId: row.researcher.id,
          year: cell.year,
          month: cell.month,
          status: cell.status,
          overdueDays: daysOverdue(cell.year, cell.month, DEADLINE_DAYS),
          action: "Awaiting PI signature",
        });
      } else if (cell.status === "signed") {
        actionsNeeded.push({
          researcherName: row.researcher.name,
          researcherId: row.researcher.id,
          year: cell.year,
          month: cell.month,
          status: cell.status,
          overdueDays: 0,
          action: "Awaiting countersignature",
        });
      }
    }
  }

  // Sort by overdue days descending, then by status severity
  actionsNeeded.sort((a, b) => b.overdueDays - a.overdueDays);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Timesheets</h1>
        <p className="mt-1 text-muted-foreground">
          Submission status matrix for the last 6 months
        </p>
      </div>

      {/* Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Status Matrix</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium sticky left-0 bg-card z-10 min-w-[180px]">
                  Researcher
                </th>
                {months.map((m) => (
                  <th
                    key={`${m.year}-${m.month}`}
                    className="px-4 py-3 font-medium text-center min-w-[130px]"
                  >
                    {formatMonthYear(m.year, m.month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {matrix.map((row) => (
                <tr key={row.researcher.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-card z-10">
                    <Link
                      href={`/researchers/${row.researcher.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {row.researcher.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.researcher.department}</p>
                  </td>
                  {row.cells.map((cell) => (
                    <td
                      key={`${cell.year}-${cell.month}`}
                      className="px-4 py-3 text-center"
                    >
                      {cell.periodId ? (
                        <Link href={`/timesheets/${cell.periodId}`}>
                          <StatusBadge status={cell.status} />
                        </Link>
                      ) : (
                        <StatusBadge status="missing" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">Legend:</span>
          {["locked", "countersigned", "signed", "submitted", "draft", "missing"].map(
            (status) => (
              <StatusBadge key={status} status={status} />
            )
          )}
        </div>
      </Card>

      {/* Actions Needed */}
      <Card>
        <CardHeader>
          <CardTitle>
            Actions Needed{" "}
            {actionsNeeded.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({actionsNeeded.length} item{actionsNeeded.length !== 1 ? "s" : ""})
              </span>
            )}
          </CardTitle>
        </CardHeader>

        {actionsNeeded.length === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-800">
              All timesheets are up to date. No actions needed.
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
                  <th className="pb-3 pr-4 font-medium">Action Required</th>
                  <th className="pb-3 pr-4 font-medium">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {actionsNeeded.map((item, idx) => (
                  <tr key={`${item.researcherId}-${item.year}-${item.month}-${idx}`} className="hover:bg-muted/50">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/researchers/${item.researcherId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {item.researcherName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatMonthYear(item.year, item.month)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 pr-4 text-sm">{item.action}</td>
                    <td className="py-3 pr-4">
                      {item.overdueDays > 0 ? (
                        <span className="font-semibold text-red-600">
                          {item.overdueDays} day{item.overdueDays !== 1 ? "s" : ""}
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
