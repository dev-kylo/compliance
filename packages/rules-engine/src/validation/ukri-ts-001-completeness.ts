import type { ValidationRule } from "@compliance/shared-types";

/**
 * UKRI-TS-001: Timesheet completeness
 *
 * Every active grant the researcher is on must have an entry (even if zero hours).
 * Missing entries are treated as missing evidence — a grant with no timesheet entry
 * for a month is a gap an auditor will flag.
 */
export const validateCompleteness: ValidationRule = (
  period,
  _researcher,
  grants
) => {
  const periodDate = new Date(period.year, period.month - 1, 1);
  const periodEndDate = new Date(period.year, period.month, 0);

  const activeGrants = grants.filter((g) => {
    return g.startDate <= periodEndDate && g.endDate >= periodDate;
  });

  const entryGrantIds = new Set(period.entries.map((e) => e.grantId));
  const missingGrants = activeGrants.filter((g) => !entryGrantIds.has(g.id));

  return {
    ruleId: "UKRI-TS-001",
    ruleName: "Timesheet completeness",
    funderClause:
      "UKRI Terms and Conditions of Grant, Section: Expenditure — staff costs must be evidenced by contemporaneous time records for all active grants",
    severity: "error",
    passed: missingGrants.length === 0,
    message:
      missingGrants.length === 0
        ? "All active grants have timesheet entries for this period."
        : `Missing timesheet entries for ${missingGrants.length} active grant(s): ${missingGrants.map((g) => g.reference).join(", ")}.`,
    details: {
      activeGrantCount: activeGrants.length,
      entryCount: period.entries.length,
      missingGrants: missingGrants.map((g) => ({
        id: g.id,
        reference: g.reference,
        title: g.title,
      })),
    },
  };
};
