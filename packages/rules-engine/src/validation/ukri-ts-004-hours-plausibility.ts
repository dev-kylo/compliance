import type { ValidationRule } from "@compliance/shared-types";

/**
 * UKRI-TS-004: Total hours plausibility
 *
 * Sum of all entries (grant + non-grant) for the month should be roughly
 * consistent with contracted hours (contractedHoursWeekly × weeks in month, ±20%).
 */
export const validateHoursPlausibility: ValidationRule = (
  period,
  researcher
) => {
  if (researcher.contractedHoursWeekly <= 0) {
    return {
      ruleId: "UKRI-TS-004",
      ruleName: "Total hours plausibility",
      funderClause:
        "UKRI Terms and Conditions of Grant, Section: Expenditure — time records must accurately reflect actual effort",
      severity: "warning",
      passed: false,
      message:
        "Cannot assess hours plausibility — researcher has no contracted hours recorded.",
      details: {
        contractedHoursWeekly: researcher.contractedHoursWeekly,
      },
    };
  }

  const contractedMonthlyHours =
    (researcher.contractedHoursWeekly * 52) / 12;

  const grantHours = period.entries.reduce((sum, e) => sum + e.hours, 0);
  const nonGrantHours = (period.nonGrantEntries ?? []).reduce(
    (sum, e) => sum + e.hours,
    0
  );
  const totalHours = grantHours + nonGrantHours;

  const lowerBound = contractedMonthlyHours * 0.8;
  const upperBound = contractedMonthlyHours * 1.2;

  const isPlausible = totalHours >= lowerBound && totalHours <= upperBound;

  let message: string;
  if (isPlausible) {
    message = `Total hours (${totalHours.toFixed(1)}) are within plausible range of contracted hours (${contractedMonthlyHours.toFixed(1)} ±20%).`;
  } else if (totalHours < lowerBound) {
    message = `Total hours (${totalHours.toFixed(1)}) are significantly below contracted hours (${contractedMonthlyHours.toFixed(1)}). Expected at least ${lowerBound.toFixed(1)} hours. Researcher may be under-reporting or on leave.`;
  } else {
    message = `Total hours (${totalHours.toFixed(1)}) significantly exceed contracted hours (${contractedMonthlyHours.toFixed(1)}). Expected at most ${upperBound.toFixed(1)} hours. Review for accuracy.`;
  }

  return {
    ruleId: "UKRI-TS-004",
    ruleName: "Total hours plausibility",
    funderClause:
      "UKRI Terms and Conditions of Grant, Section: Expenditure — time records must accurately reflect actual effort",
    severity: "warning",
    passed: isPlausible,
    message,
    details: {
      totalHours,
      grantHours,
      nonGrantHours,
      contractedMonthlyHours: Math.round(contractedMonthlyHours * 100) / 100,
      lowerBound: Math.round(lowerBound * 100) / 100,
      upperBound: Math.round(upperBound * 100) / 100,
      contractedHoursWeekly: researcher.contractedHoursWeekly,
    },
  };
};
