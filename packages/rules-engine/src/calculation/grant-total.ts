import type {
  CalculationResult,
  CalculationWorkings,
  FunderProfile,
  Grant,
  GrantTotalResult,
  Researcher,
  TimesheetPeriod,
} from "@compliance/shared-types";
import { calculateUKRISalaryCost } from "./ukri-salary-cost";

/**
 * Calculate total claimable cost for a grant across all researchers and all months.
 */
export function calculateGrantTotal(
  grant: Grant,
  allPeriods: TimesheetPeriod[],
  researchers: Researcher[],
  funderProfile: FunderProfile
): GrantTotalResult {
  const workings: CalculationWorkings[] = [];
  const byResearcher: GrantTotalResult["byResearcher"] = [];

  let totalClaimableCost = 0;

  for (const researcher of researchers) {
    const researcherPeriods = allPeriods.filter(
      (p) => p.researcherId === researcher.id
    );

    const monthlyBreakdown: CalculationResult[] = [];
    let researcherTotal = 0;

    for (const period of researcherPeriods) {
      const hasGrantEntry = period.entries.some(
        (e) => e.grantId === grant.id
      );
      if (!hasGrantEntry) continue;

      const result = calculateUKRISalaryCost({
        period,
        researcher,
        grant,
        funderProfile,
      });

      monthlyBreakdown.push(result);
      researcherTotal += result.claimableCost;
    }

    if (monthlyBreakdown.length > 0) {
      const roundedResearcherTotal =
        Math.round(researcherTotal * 100) / 100;

      byResearcher.push({
        researcherId: researcher.id,
        researcherName: researcher.name,
        totalClaimable: roundedResearcherTotal,
        monthlyBreakdown,
      });

      workings.push({
        step: `Total for ${researcher.name}`,
        formula: `Sum of ${monthlyBreakdown.length} monthly calculations = £${roundedResearcherTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
        result: roundedResearcherTotal,
      });

      totalClaimableCost += roundedResearcherTotal;
    }
  }

  const roundedTotal = Math.round(totalClaimableCost * 100) / 100;
  const percentBudgetUsed =
    grant.totalStaffBudget > 0
      ? Math.round((roundedTotal / grant.totalStaffBudget) * 10000) / 100
      : 0;

  workings.push({
    step: "Grant total claimable cost",
    formula: `Sum across ${byResearcher.length} researcher(s) = £${roundedTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
    result: roundedTotal,
  });

  workings.push({
    step: "Budget utilisation",
    formula: `£${roundedTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })} ÷ £${grant.totalStaffBudget.toLocaleString("en-GB", { minimumFractionDigits: 2 })} = ${percentBudgetUsed}%`,
    result: percentBudgetUsed,
  });

  return {
    grantId: grant.id,
    grantReference: grant.reference,
    totalClaimableCost: roundedTotal,
    totalStaffBudget: grant.totalStaffBudget,
    percentBudgetUsed,
    byResearcher,
    workings,
  };
}
