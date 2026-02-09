/// <reference types="vitest/globals" />

/**
 * Golden Test: UKRI Salary Cost -- Edge Cases
 *
 * These expected values are hand-calculated and expert-validated.
 * If a test fails, the code is wrong -- not the test.
 *
 * This file tests boundary conditions and structural invariants:
 *   - Zero project hours (grant entry missing from timesheet)
 *   - Effort exceeding funded FTE by more than 25% (warning threshold)
 *   - Workings array structure: exactly 5 steps for a standard calculation
 *   - Each working step has the required fields (step, formula, result)
 */

import { calculateUKRISalaryCost } from "../../src/calculation/ukri-salary-cost";
import type {
  CalculationInput,
  Researcher,
  Grant,
  TimesheetPeriod,
} from "@compliance/shared-types";
import { UKRI_PROFILE } from "../../src/funder-profiles/ukri";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const drSarahChen: Researcher = {
  id: "researcher-001",
  name: "Dr Sarah Chen",
  email: "s.chen@university.ac.uk",
  department: "Physics",
  contractedHoursWeekly: 35,
  employmentFraction: 1.0,
  annualSalary: 52_000,
  salaryEffectiveDate: new Date("2024-08-01"),
  institutionId: "inst-001",
};

const grantEP: Grant = {
  id: "grant-001",
  funderProfileId: "ukri",
  title: "Quantum Materials Research Programme",
  reference: "EP/T023456/1",
  startDate: new Date("2024-04-01"),
  endDate: new Date("2027-03-31"),
  fundedFTE: 0.4,
  totalStaffBudget: 180_000,
  principalInvestigatorId: "pi-001",
  institutionId: "inst-001",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Golden: UKRI salary cost -- edge cases", () => {
  test("zero project hours when grant entry is absent from timesheet", () => {
    // When the timesheet has no entry for the grant at all, the calculation
    // should treat this as 0 project hours and produce £0 claimable cost.

    const period: TimesheetPeriod = {
      id: "period-2025-12",
      researcherId: "researcher-001",
      year: 2025,
      month: 12,
      status: "submitted",
      submittedAt: new Date("2026-01-05"),
      signedAt: null,
      countersignedAt: null,
      lockedAt: null,
      entries: [
        // Entry for a DIFFERENT grant -- nothing for grant-001
        {
          id: "entry-099",
          timesheetPeriodId: "period-2025-12",
          grantId: "grant-other",
          hours: 50,
          notes: null,
        },
      ],
    };

    const input: CalculationInput = {
      period,
      researcher: drSarahChen,
      grant: grantEP,
      funderProfile: UKRI_PROFILE,
    };

    const result = calculateUKRISalaryCost(input);

    expect(result.projectHours).toBe(0);
    expect(result.effortPercentage).toBe(0);
    expect(result.salaryCostCharged).toBe(0);
    expect(result.claimableCost).toBe(0);

    // Warning must explain that no hours were recorded
    expect(result.warnings).toContain(
      "No hours recorded for this grant in this period. Claimable cost is £0."
    );
  });

  test("effort exceeding funded FTE by more than 25% produces a warning", () => {
    // Grant funded FTE = 0.4, so the 125% threshold = 0.50.
    // With 80 project hours:
    //   effort = 80 / 151.6667 = 52.75%, which exceeds 50%.
    //
    // Hand-calculated worksheet:
    //   monthly hours = (35 x 52) / 12 = 151.67
    //   effort        = 80 / 151.6667  = 52.75%
    //   monthly salary = 52,000 / 12   = £4,333.33
    //   salary cost   = 0.5275... x 4,333.33... = £2,285.71
    //   claimable     = 2,285.71... x 0.80 = £1,828.57

    const period: TimesheetPeriod = {
      id: "period-2026-01",
      researcherId: "researcher-001",
      year: 2026,
      month: 1,
      status: "countersigned",
      submittedAt: new Date("2026-02-03"),
      signedAt: new Date("2026-02-04"),
      countersignedAt: new Date("2026-02-05"),
      lockedAt: null,
      entries: [
        {
          id: "entry-080",
          timesheetPeriodId: "period-2026-01",
          grantId: "grant-001",
          hours: 80,
          notes: "Intensive measurement campaign",
        },
      ],
    };

    const input: CalculationInput = {
      period,
      researcher: drSarahChen,
      grant: grantEP,
      funderProfile: UKRI_PROFILE,
    };

    const result = calculateUKRISalaryCost(input);

    // Monetary values must still be calculated correctly
    expect(result.contractedMonthlyHours).toBe(151.67);
    expect(result.effortPercentage).toBe(0.5275);
    expect(result.monthlySalary).toBe(4333.33);
    expect(result.salaryCostCharged).toBe(2285.71);
    expect(result.claimableCost).toBe(1828.57);

    // The FTE overrun warning must be present
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);

    const fteWarning = result.warnings.find((w) =>
      w.includes("exceeds funded FTE")
    );
    expect(fteWarning).toBeDefined();
    expect(fteWarning).toContain("52.75%");
    expect(fteWarning).toContain("40%");
    expect(fteWarning).toContain("more than 25%");
  });

  test("workings array has exactly 5 steps for a standard UKRI calculation", () => {
    // A standard UKRI salary cost calculation with a non-null fEC rate
    // must produce exactly 5 working steps, in order:
    //   1. Contracted monthly hours
    //   2. Effort percentage
    //   3. Monthly salary
    //   4. Salary cost charged to grant
    //   5. Apply fEC rate

    const period: TimesheetPeriod = {
      id: "period-2025-10",
      researcherId: "researcher-001",
      year: 2025,
      month: 10,
      status: "countersigned",
      submittedAt: new Date("2025-11-03"),
      signedAt: new Date("2025-11-04"),
      countersignedAt: new Date("2025-11-05"),
      lockedAt: null,
      entries: [
        {
          id: "entry-structure",
          timesheetPeriodId: "period-2025-10",
          grantId: "grant-001",
          hours: 14,
          notes: null,
        },
      ],
    };

    const input: CalculationInput = {
      period,
      researcher: drSarahChen,
      grant: grantEP,
      funderProfile: UKRI_PROFILE,
    };

    const result = calculateUKRISalaryCost(input);

    expect(result.workings).toHaveLength(5);

    // Verify the step names in order
    expect(result.workings[0].step).toBe("Calculate contracted monthly hours");
    expect(result.workings[1].step).toBe("Calculate effort percentage");
    expect(result.workings[2].step).toBe("Calculate monthly salary");
    expect(result.workings[3].step).toBe(
      "Calculate salary cost charged to grant"
    );
    expect(result.workings[4].step).toContain("Apply fEC rate");
    expect(result.workings[4].step).toContain("80%");
  });

  test("each working step has required fields: step, formula, and result", () => {
    const period: TimesheetPeriod = {
      id: "period-2025-10",
      researcherId: "researcher-001",
      year: 2025,
      month: 10,
      status: "countersigned",
      submittedAt: new Date("2025-11-03"),
      signedAt: new Date("2025-11-04"),
      countersignedAt: new Date("2025-11-05"),
      lockedAt: null,
      entries: [
        {
          id: "entry-fields",
          timesheetPeriodId: "period-2025-10",
          grantId: "grant-001",
          hours: 14,
          notes: null,
        },
      ],
    };

    const input: CalculationInput = {
      period,
      researcher: drSarahChen,
      grant: grantEP,
      funderProfile: UKRI_PROFILE,
    };

    const result = calculateUKRISalaryCost(input);

    for (const working of result.workings) {
      // Each step must have a human-readable step name
      expect(typeof working.step).toBe("string");
      expect(working.step.length).toBeGreaterThan(0);

      // Each step must have a formula showing the calculation
      expect(typeof working.formula).toBe("string");
      expect(working.formula.length).toBeGreaterThan(0);

      // Each step must have a numeric result
      expect(typeof working.result).toBe("number");
      expect(Number.isFinite(working.result)).toBe(true);
    }
  });
});
