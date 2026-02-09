import type {
  CalculationInput,
  CalculationResult,
  CalculationWorkings,
} from "@compliance/shared-types";

/**
 * UKRI Salary Cost Calculation
 *
 * Methodology:
 * 1. Contracted monthly hours = (contractedHoursWeekly × 52) / 12
 * 2. Effort percentage = project hours for the month ÷ contracted monthly hours
 * 3. Monthly salary = annual salary ÷ 12
 * 4. Salary cost charged to grant = effort percentage × monthly salary
 * 5. Claimable cost = salary cost × fEC rate (0.80 for UKRI)
 *
 * Edge cases:
 * - Uses contracted hours, not actual hours worked (apportionment rule)
 * - Part-time staff: contracted hours and salary are already pro-rated
 * - Salary changes mid-grant: uses salary effective during the period (TODO: salary history)
 */
export function calculateUKRISalaryCost(
  input: CalculationInput
): CalculationResult {
  const { period, researcher, grant, funderProfile } = input;
  const warnings: string[] = [];
  const workings: CalculationWorkings[] = [];

  // Find the hours for this grant in this period
  const entry = period.entries.find((e) => e.grantId === grant.id);
  const projectHours = entry?.hours ?? 0;

  if (projectHours === 0) {
    warnings.push(
      "No hours recorded for this grant in this period. Claimable cost is £0."
    );
  }

  // Step 1: Contracted monthly hours
  const contractedMonthlyHours =
    (researcher.contractedHoursWeekly * 52) / 12;
  const roundedMonthlyHours =
    Math.round(contractedMonthlyHours * 100) / 100;

  workings.push({
    step: "Calculate contracted monthly hours",
    formula: `${researcher.contractedHoursWeekly} hours/week × 52 weeks ÷ 12 months = ${roundedMonthlyHours} hours/month`,
    result: roundedMonthlyHours,
    notes:
      "Uses contracted hours, not actual hours worked. This is the UKRI apportionment methodology — effort is measured against contractual obligation, not total hours physically worked.",
  });

  // Step 2: Effort percentage
  const effortPercentage =
    contractedMonthlyHours > 0
      ? projectHours / contractedMonthlyHours
      : 0;
  const roundedEffort = Math.round(effortPercentage * 10000) / 10000;
  const effortDisplay = (roundedEffort * 100).toFixed(2);

  workings.push({
    step: "Calculate effort percentage",
    formula: `${projectHours} project hours ÷ ${roundedMonthlyHours} contracted hours = ${effortDisplay}%`,
    result: roundedEffort,
  });

  // Step 3: Monthly salary
  const monthlySalary = researcher.annualSalary / 12;
  const roundedMonthlySalary = Math.round(monthlySalary * 100) / 100;

  workings.push({
    step: "Calculate monthly salary",
    formula: `£${researcher.annualSalary.toLocaleString("en-GB")} ÷ 12 = £${roundedMonthlySalary.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
    result: roundedMonthlySalary,
    notes:
      researcher.employmentFraction < 1
        ? `Researcher is ${researcher.employmentFraction} FTE — salary is already pro-rated for part-time employment.`
        : undefined,
  });

  // Step 4: Salary cost charged to grant
  const salaryCostCharged = effortPercentage * monthlySalary;
  const roundedSalaryCost = Math.round(salaryCostCharged * 100) / 100;

  workings.push({
    step: "Calculate salary cost charged to grant",
    formula: `${effortDisplay}% × £${roundedMonthlySalary.toLocaleString("en-GB", { minimumFractionDigits: 2 })} = £${roundedSalaryCost.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
    result: roundedSalaryCost,
  });

  // Step 5: Apply fEC rate
  // Use the rounded salary cost so that displayed formula matches the actual calculation
  const fecRate = funderProfile.fecRate;
  let claimableCost: number;

  if (fecRate !== null) {
    claimableCost = roundedSalaryCost * fecRate;
    const roundedClaimable = Math.round(claimableCost * 100) / 100;

    workings.push({
      step: `Apply fEC rate (${funderProfile.name} ${(fecRate * 100).toFixed(0)}%)`,
      formula: `£${roundedSalaryCost.toLocaleString("en-GB", { minimumFractionDigits: 2 })} × ${fecRate} = £${roundedClaimable.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
      result: roundedClaimable,
      notes: `${funderProfile.name} funds at ${(fecRate * 100).toFixed(0)}% of full Economic Cost.`,
    });

    claimableCost = roundedClaimable;
  } else {
    claimableCost = roundedSalaryCost;
    workings.push({
      step: "No fEC rate applicable",
      formula: `Claimable cost = salary cost = £${roundedSalaryCost.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
      result: roundedSalaryCost,
      notes: "This funder does not apply a fEC rate adjustment.",
    });
  }

  // Warn if effort seems high relative to funded FTE
  if (effortPercentage > grant.fundedFTE * 1.25) {
    warnings.push(
      `Effort this month (${effortDisplay}%) exceeds funded FTE (${(grant.fundedFTE * 100).toFixed(0)}%) by more than 25%. Review for consistency.`
    );
  }

  return {
    grantId: grant.id,
    researcherId: researcher.id,
    periodYear: period.year,
    periodMonth: period.month,
    projectHours,
    contractedMonthlyHours: roundedMonthlyHours,
    effortPercentage: roundedEffort,
    monthlySalary: roundedMonthlySalary,
    salaryCostCharged: roundedSalaryCost,
    fecRate,
    claimableCost,
    workings,
    warnings,
  };
}
