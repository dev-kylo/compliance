import type { Grant, Researcher, TimesheetPeriod } from "./domain";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  funderClause: string;
  severity: ValidationSeverity;
  passed: boolean;
  message: string;
  details: Record<string, unknown>;
}

export type ValidationRule = (
  period: TimesheetPeriod,
  researcher: Researcher,
  grants: Grant[],
  allPeriods?: TimesheetPeriod[]
) => ValidationResult;
