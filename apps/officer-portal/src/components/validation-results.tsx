import { cn } from "@/lib/utils";
import { getSeverityColor } from "@/lib/utils";

interface ValidationResultItem {
  ruleId: string;
  ruleName: string;
  funderClause: string;
  severity: string;
  passed: boolean;
  message: string;
  details: Record<string, unknown>;
}

export function ValidationResults({ results }: { results: ValidationResultItem[] }) {
  const failures = results.filter(r => !r.passed);
  const passes = results.filter(r => r.passed);

  if (failures.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="font-medium text-green-800">All {results.length} validation rules passed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {failures.map((r) => (
        <div key={r.ruleId} className={cn("rounded-lg border p-4", getSeverityColor(r.severity))}>
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs">{r.ruleId}</span>
              <span className="ml-2 text-sm font-medium">{r.ruleName}</span>
            </div>
            <span className="rounded px-2 py-0.5 text-xs font-medium uppercase">{r.severity}</span>
          </div>
          <p className="mt-1 text-sm">{r.message}</p>
          <p className="mt-1 text-xs opacity-70">Clause: {r.funderClause}</p>
        </div>
      ))}
      {passes.length > 0 && (
        <p className="text-sm text-muted-foreground">{passes.length} other rule(s) passed</p>
      )}
    </div>
  );
}
