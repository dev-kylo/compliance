import type { ValidationRule } from "@compliance/shared-types";

/**
 * UKRI-TS-005: Grant period boundary
 *
 * No hours allocated to a grant outside its start/end dates.
 * Expenditure outside the grant period is ineligible.
 */
export const validateGrantBoundary: ValidationRule = (
  period,
  _researcher,
  grants
) => {
  const periodStart = new Date(period.year, period.month - 1, 1);
  const periodEnd = new Date(period.year, period.month, 0);

  const grantsById = new Map(grants.map((g) => [g.id, g]));

  const violations: {
    grantId: string;
    grantReference: string;
    hours: number;
    reason: string;
  }[] = [];

  for (const entry of period.entries) {
    if (entry.hours === 0) continue;

    const grant = grantsById.get(entry.grantId);
    if (!grant) continue;

    if (grant.endDate < periodStart) {
      violations.push({
        grantId: entry.grantId,
        grantReference: grant.reference,
        hours: entry.hours,
        reason: `Grant ended on ${grant.endDate.toISOString().slice(0, 10)}, before this period.`,
      });
    } else if (grant.startDate > periodEnd) {
      violations.push({
        grantId: entry.grantId,
        grantReference: grant.reference,
        hours: entry.hours,
        reason: `Grant starts on ${grant.startDate.toISOString().slice(0, 10)}, after this period.`,
      });
    }
  }

  return {
    ruleId: "UKRI-TS-005",
    ruleName: "Grant period boundary",
    funderClause:
      "UKRI Terms and Conditions of Grant, Section: Eligible Expenditure — costs must fall within the grant period",
    severity: "error",
    passed: violations.length === 0,
    message:
      violations.length === 0
        ? "All timesheet entries fall within their respective grant periods."
        : `${violations.length} entry/entries allocate hours to grants outside their active period: ${violations.map((v) => v.grantReference).join(", ")}.`,
    details: {
      violations,
    },
  };
};
