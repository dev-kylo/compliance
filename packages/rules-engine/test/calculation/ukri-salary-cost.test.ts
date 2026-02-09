/// <reference types="vitest/globals" />

import type {
  TimesheetPeriod,
  Researcher,
  Grant,
  FunderProfile,
  CalculationInput,
  CalculationResult,
} from "@compliance/shared-types";
import { UKRI_PROFILE } from "../../src/funder-profiles/ukri";
import { calculateUKRISalaryCost } from "../../src/calculation/ukri-salary-cost";

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function makeResearcher(overrides: Partial<Researcher> = {}): Researcher {
  return {
    id: "r-1",
    name: "Dr Ada Lovelace",
    email: "ada@example.ac.uk",
    department: "Computer Science",
    contractedHoursWeekly: 35,
    employmentFraction: 1,
    annualSalary: 50_000,
    salaryEffectiveDate: new Date("2025-01-01"),
    institutionId: "inst-1",
    ...overrides,
  };
}

function makeGrant(overrides: Partial<Grant> = {}): Grant {
  return {
    id: "g-1",
    funderProfileId: "ukri",
    title: "Test Grant",
    reference: "EP/X000001/1",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2027-12-31"),
    fundedFTE: 0.5,
    totalStaffBudget: 120_000,
    principalInvestigatorId: "pi-1",
    institutionId: "inst-1",
    ...overrides,
  };
}

function makePeriod(
  overrides: Partial<TimesheetPeriod> = {},
  grantId = "g-1",
  hours = 14
): TimesheetPeriod {
  return {
    id: "tp-1",
    researcherId: "r-1",
    year: 2025,
    month: 3,
    status: "draft",
    submittedAt: null,
    signedAt: null,
    countersignedAt: null,
    lockedAt: null,
    entries: [
      {
        id: "e-1",
        timesheetPeriodId: "tp-1",
        grantId,
        hours,
        notes: null,
      },
    ],
    ...overrides,
  };
}

function makeInput(overrides: {
  period?: Partial<TimesheetPeriod>;
  researcher?: Partial<Researcher>;
  grant?: Partial<Grant>;
  funderProfile?: FunderProfile;
  periodGrantId?: string;
  periodHours?: number;
} = {}): CalculationInput {
  return {
    period: makePeriod(
      overrides.period,
      overrides.periodGrantId,
      overrides.periodHours
    ),
    researcher: makeResearcher(overrides.researcher),
    grant: makeGrant(overrides.grant),
    funderProfile: overrides.funderProfile ?? UKRI_PROFILE,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("calculateUKRISalaryCost", () => {
  it("basic calculation produces correct claimable cost", () => {
    // 35 hrs/week, £50,000 salary, 14 project hours
    const result = calculateUKRISalaryCost(makeInput());

    // Step 1: Monthly hours = (35 * 52) / 12 = 151.6667 → rounded to 151.67
    expect(result.contractedMonthlyHours).toBeCloseTo(151.67, 1);

    // Step 2: Effort = 14 / 151.6667 ≈ 0.0923
    expect(result.effortPercentage).toBeCloseTo(0.0923, 3);

    // Step 3: Monthly salary = 50000 / 12 ≈ 4166.67
    expect(result.monthlySalary).toBeCloseTo(4166.67, 1);

    // Step 4: Salary cost charged = effort × monthly salary ≈ 384.62
    expect(result.salaryCostCharged).toBeCloseTo(384.62, 0);

    // Step 5: Claimable = salary cost × 0.80 ≈ 307.69
    expect(result.claimableCost).toBeCloseTo(307.69, 0);

    // fEC rate should be 0.8 for UKRI
    expect(result.fecRate).toBe(0.8);

    // Identifiers
    expect(result.grantId).toBe("g-1");
    expect(result.researcherId).toBe("r-1");
    expect(result.periodYear).toBe(2025);
    expect(result.periodMonth).toBe(3);
    expect(result.projectHours).toBe(14);

    // No warnings for a normal calculation
    expect(result.warnings).toHaveLength(0);
  });

  it("zero hours produces zero cost with warning", () => {
    const result = calculateUKRISalaryCost(
      makeInput({ periodHours: 0 })
    );

    expect(result.claimableCost).toBe(0);
    expect(result.salaryCostCharged).toBe(0);
    expect(result.effortPercentage).toBe(0);
    expect(result.projectHours).toBe(0);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings[0]).toMatch(/no hours recorded/i);
  });

  it("workings array has 5 entries for a standard calculation", () => {
    const result = calculateUKRISalaryCost(makeInput());

    // Steps: monthly hours, effort %, monthly salary, salary cost, fEC rate
    expect(result.workings).toHaveLength(5);
  });

  it("each working has step, formula, and result fields", () => {
    const result = calculateUKRISalaryCost(makeInput());

    for (const working of result.workings) {
      expect(working).toHaveProperty("step");
      expect(working).toHaveProperty("formula");
      expect(working).toHaveProperty("result");
      expect(typeof working.step).toBe("string");
      expect(typeof working.formula).toBe("string");
      expect(typeof working.result).toBe("number");
    }
  });

  it("part-time researcher calculation is correct", () => {
    // 37.5 hrs/week, 0.8 FTE, £45,000 salary, 40 project hours
    const result = calculateUKRISalaryCost(
      makeInput({
        researcher: {
          contractedHoursWeekly: 37.5,
          employmentFraction: 0.8,
          annualSalary: 45_000,
        },
        periodHours: 40,
      })
    );

    // Monthly hours = (37.5 * 52) / 12 = 162.5
    expect(result.contractedMonthlyHours).toBeCloseTo(162.5, 1);

    // Effort = 40 / 162.5 = 0.2462 (24.62%)
    expect(result.effortPercentage).toBeCloseTo(0.2462, 3);

    // Monthly salary = 45000 / 12 = 3750
    expect(result.monthlySalary).toBeCloseTo(3750, 1);

    // Salary cost = 0.2462 * 3750 ≈ 923.08
    expect(result.salaryCostCharged).toBeCloseTo(923.08, 0);

    // Claimable = 923.08 * 0.80 ≈ 738.46
    expect(result.claimableCost).toBeCloseTo(738.46, 0);

    // The workings note about part-time should be present
    const salaryWorking = result.workings.find((w) =>
      w.step.includes("monthly salary")
    );
    expect(salaryWorking?.notes).toMatch(/0\.8 FTE/);
  });

  it("warning generated when effort exceeds funded FTE by >25%", () => {
    // Grant funded FTE = 0.5 → 50% effort is the cap
    // 25% above that = 62.5%
    // We need effort > 62.5% to trigger the warning
    // Monthly hours ≈ 151.67 → need > 151.67 * 0.625 ≈ 94.8 hours
    const result = calculateUKRISalaryCost(
      makeInput({
        periodHours: 100,
        grant: { fundedFTE: 0.5 },
      })
    );

    // Effort = 100 / 151.67 ≈ 65.9%, which is > 62.5%
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(
      result.warnings.some((w) => w.includes("exceeds funded FTE"))
    ).toBe(true);
  });
});
