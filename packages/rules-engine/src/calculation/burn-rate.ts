import type {
  BurnRateResult,
  CalculationResult,
  CalculationWorkings,
  Grant,
} from "@compliance/shared-types";

/**
 * Calculate burn rate for a grant — comparison of claimed vs funded.
 * Answers: "At the current pace, will we spend the budget?"
 */
export function calculateBurnRate(
  grant: Grant,
  calculationResults: CalculationResult[]
): BurnRateResult {
  const workings: CalculationWorkings[] = [];

  const totalClaimedToDate = calculationResults.reduce(
    (sum, r) => sum + r.claimableCost,
    0
  );
  const roundedClaimed = Math.round(totalClaimedToDate * 100) / 100;

  // Calculate months elapsed since grant start
  const now = new Date();
  const grantStart = new Date(grant.startDate);
  const grantEnd = new Date(grant.endDate);

  const monthsElapsed = Math.max(
    1,
    (now.getFullYear() - grantStart.getFullYear()) * 12 +
      (now.getMonth() - grantStart.getMonth())
  );

  const totalGrantMonths = Math.max(
    1,
    (grantEnd.getFullYear() - grantStart.getFullYear()) * 12 +
      (grantEnd.getMonth() - grantStart.getMonth())
  );

  const monthsRemaining = Math.max(0, totalGrantMonths - monthsElapsed);

  workings.push({
    step: "Total claimed to date",
    formula: `Sum of ${calculationResults.length} monthly calculation(s) = £${roundedClaimed.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
    result: roundedClaimed,
  });

  // Average monthly burn — use rounded claimed value for consistency with displayed formula
  const averageMonthlyBurn = roundedClaimed / monthsElapsed;
  const roundedMonthlyBurn = Math.round(averageMonthlyBurn * 100) / 100;

  workings.push({
    step: "Average monthly burn rate",
    formula: `£${roundedClaimed.toLocaleString("en-GB", { minimumFractionDigits: 2 })} ÷ ${monthsElapsed} months = £${roundedMonthlyBurn.toLocaleString("en-GB", { minimumFractionDigits: 2 })}/month`,
    result: roundedMonthlyBurn,
  });

  // Projected total — use rounded monthly burn for consistency with displayed formula
  const projectedTotalCost = roundedMonthlyBurn * totalGrantMonths;
  const roundedProjected = Math.round(projectedTotalCost * 100) / 100;

  workings.push({
    step: "Projected total cost at current burn rate",
    formula: `£${roundedMonthlyBurn.toLocaleString("en-GB", { minimumFractionDigits: 2 })}/month × ${totalGrantMonths} total months = £${roundedProjected.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
    result: roundedProjected,
  });

  // Over/under spend — use rounded projected cost for consistency
  const projectedOverUnderSpend = roundedProjected - grant.totalStaffBudget;
  const roundedOverUnder =
    Math.round(projectedOverUnderSpend * 100) / 100;

  workings.push({
    step: "Projected over/under spend",
    formula: `£${roundedProjected.toLocaleString("en-GB", { minimumFractionDigits: 2 })} - £${grant.totalStaffBudget.toLocaleString("en-GB", { minimumFractionDigits: 2 })} = £${roundedOverUnder.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
    result: roundedOverUnder,
    notes:
      roundedOverUnder > 0
        ? "Projected to overspend staff budget at current rate."
        : roundedOverUnder < 0
          ? "Projected to underspend staff budget at current rate."
          : "Projected to spend exactly on budget.",
  });

  // Determine status — ±10% tolerance
  const tolerance = grant.totalStaffBudget * 0.1;
  let burnRateStatus: "on_track" | "underspending" | "overspending";

  if (projectedOverUnderSpend > tolerance) {
    burnRateStatus = "overspending";
  } else if (projectedOverUnderSpend < -tolerance) {
    burnRateStatus = "underspending";
  } else {
    burnRateStatus = "on_track";
  }

  return {
    grantId: grant.id,
    grantReference: grant.reference,
    totalStaffBudget: grant.totalStaffBudget,
    totalClaimedToDate: roundedClaimed,
    monthsElapsed,
    monthsRemaining,
    averageMonthlyBurn: roundedMonthlyBurn,
    projectedTotalCost: roundedProjected,
    projectedOverUnderSpend: roundedOverUnder,
    burnRateStatus,
    workings,
  };
}
