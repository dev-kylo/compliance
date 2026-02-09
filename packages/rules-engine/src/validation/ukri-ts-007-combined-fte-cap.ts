import type { ValidationRule } from "@compliance/shared-types";

/**
 * UKRI-TS-007: Combined FTE cap
 *
 * Total grant FTE allocations for a researcher should not exceed their
 * employment fraction. If someone is 0.8 FTE employed and allocated
 * 0.5 FTE on Grant A + 0.5 FTE on Grant B, the maths doesn't work.
 */
export const validateCombinedFTECap: ValidationRule = (
  period,
  researcher,
  grants
) => {
  const contractedMonthlyHours =
    (researcher.contractedHoursWeekly * 52) / 12;

  if (contractedMonthlyHours <= 0) {
    const totalHours = grants.reduce((sum, grant) => {
      const entry = period.entries.find((e) => e.grantId === grant.id);
      return sum + (entry?.hours ?? 0);
    }, 0);

    return {
      ruleId: "UKRI-TS-007",
      ruleName: "Combined FTE cap",
      funderClause:
        "UKRI Terms and Conditions of Grant, Section: Eligible Expenditure — total effort charged across all grants must not exceed the researcher's employment fraction",
      severity: "error",
      passed: totalHours === 0,
      message:
        totalHours === 0
          ? "No hours recorded and no contracted hours — check not applicable."
          : "Cannot calculate FTE — researcher has no contracted hours recorded, but hours have been charged to grants.",
      details: {
        contractedMonthlyHours: 0,
        totalGrantHours: totalHours,
        employmentFraction: researcher.employmentFraction,
      },
    };
  }

  const grantAllocations = grants.map((grant) => {
    const entry = period.entries.find((e) => e.grantId === grant.id);
    const hours = entry?.hours ?? 0;
    const fte = hours / contractedMonthlyHours;
    return {
      grantId: grant.id,
      grantReference: grant.reference,
      hours,
      fte: Math.round(fte * 1000) / 1000,
    };
  });

  const totalGrantFTE = grantAllocations.reduce((sum, a) => sum + a.fte, 0);
  const roundedTotalFTE = Math.round(totalGrantFTE * 1000) / 1000;

  const passed = roundedTotalFTE <= researcher.employmentFraction + 0.001;

  return {
    ruleId: "UKRI-TS-007",
    ruleName: "Combined FTE cap",
    funderClause:
      "UKRI Terms and Conditions of Grant, Section: Eligible Expenditure — total effort charged across all grants must not exceed the researcher's employment fraction",
    severity: "error",
    passed,
    message: passed
      ? `Combined grant FTE (${roundedTotalFTE}) is within employment fraction (${researcher.employmentFraction}).`
      : `Combined grant FTE (${roundedTotalFTE}) exceeds employment fraction (${researcher.employmentFraction}). Excess effort of ${(roundedTotalFTE - researcher.employmentFraction).toFixed(3)} FTE cannot be charged to grants.`,
    details: {
      grantAllocations,
      totalGrantFTE: roundedTotalFTE,
      employmentFraction: researcher.employmentFraction,
      contractedMonthlyHours:
        Math.round(contractedMonthlyHours * 100) / 100,
    },
  };
};
