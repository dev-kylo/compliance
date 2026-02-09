import { getGrants } from "@/lib/data/grants";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function GrantsPage() {
  const grants = await getGrants();
  const now = new Date();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grants</h1>
          <p className="mt-1 text-muted-foreground">
            {grants.length} grant{grants.length !== 1 ? "s" : ""} in total
          </p>
        </div>
      </div>

      {/* Grants Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Funder</th>
              <th className="px-4 py-3 font-medium">Start Date</th>
              <th className="px-4 py-3 font-medium">End Date</th>
              <th className="px-4 py-3 font-medium text-center">Researchers</th>
              <th className="px-4 py-3 font-medium text-right">Staff Budget</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {grants.map((grant) => {
              const isActive = now >= new Date(grant.startDate) && now <= new Date(grant.endDate);
              const funderLabel = grant.funderProfileId === "ukri" ? "UKRI" : grant.funderProfileId;
              const researcherCount = grant.grantAllocations.length;

              return (
                <tr key={grant.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/grants/${grant.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {grant.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={grant.title}>
                    {grant.title}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{funderLabel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(grant.startDate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(grant.endDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {researcherCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(grant.totalStaffBudget)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : now > new Date(grant.endDate) ? (
                      <Badge variant="error">Ended</Badge>
                    ) : (
                      <Badge variant="warning">Not Started</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {grants.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No grants found.
          </div>
        )}
      </div>
    </div>
  );
}
