import type { ValidationRule } from "@compliance/shared-types";

/**
 * UKRI-TS-006: FTE consistency
 *
 * Average monthly allocation to a grant should be roughly consistent with the
 * funded FTE (±25% over a rolling 6-month window). Flag consistent
 * over-allocation or under-allocation.
 */
export const validateFTEConsistency: ValidationRule = (
  period,
  researcher,
  grants,
  allPeriods
) => {
  const contractedMonthlyHours =
    (researcher.contractedHoursWeekly * 52) / 12;

  const warnings: {
    grantId: string;
    grantReference: string;
    fundedFTE: number;
    averageFTE: number;
    deviation: string;
  }[] = [];

  for (const grant of grants) {
    const relevantPeriods = getRelevantPeriods(
      period,
      allPeriods ?? [],
      grant.id
    );

    if (relevantPeriods.length < 3) continue;

    const totalHours = relevantPeriods.reduce((sum, p) => {
      const grantEntry = p.entries.find((e) => e.grantId === grant.id);
      return sum + (grantEntry?.hours ?? 0);
    }, 0);

    const averageMonthlyHours = totalHours / relevantPeriods.length;
    const averageFTE = averageMonthlyHours / contractedMonthlyHours;

    const lowerBound = grant.fundedFTE * 0.75;
    const upperBound = grant.fundedFTE * 1.25;

    if (averageFTE < lowerBound || averageFTE > upperBound) {
      warnings.push({
        grantId: grant.id,
        grantReference: grant.reference,
        fundedFTE: grant.fundedFTE,
        averageFTE: Math.round(averageFTE * 1000) / 1000,
        deviation:
          averageFTE < lowerBound ? "under-allocated" : "over-allocated",
      });
    }
  }

  return {
    ruleId: "UKRI-TS-006",
    ruleName: "FTE consistency",
    funderClause:
      "UKRI Terms and Conditions of Grant, Section: Expenditure — effort charged to the grant should be consistent with the funded FTE allocation",
    severity: "warning",
    passed: warnings.length === 0,
    message:
      warnings.length === 0
        ? "Grant allocations are consistent with funded FTE over the rolling window."
        : `${warnings.length} grant(s) show inconsistent FTE allocation: ${warnings.map((w) => `${w.grantReference} (funded ${w.fundedFTE} FTE, actual ${w.averageFTE} FTE — ${w.deviation})`).join("; ")}.`,
    details: {
      warnings,
      contractedMonthlyHours:
        Math.round(contractedMonthlyHours * 100) / 100,
      windowMonths: 6,
    },
  };
};

function getRelevantPeriods(
  currentPeriod: { year: number; month: number },
  allPeriods: { year: number; month: number; entries: { grantId: string; hours: number }[] }[],
  grantId: string
): { year: number; month: number; entries: { grantId: string; hours: number }[] }[] {
  const currentDate = new Date(currentPeriod.year, currentPeriod.month - 1);
  const sixMonthsAgo = new Date(currentDate);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

  return allPeriods.filter((p) => {
    const pDate = new Date(p.year, p.month - 1);
    if (pDate < sixMonthsAgo || pDate > currentDate) return false;
    return p.entries.some((e) => e.grantId === grantId);
  });
}
