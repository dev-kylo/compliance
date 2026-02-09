/// <reference types="vitest/globals" />

/**
 * Golden Test: UKRI Salary Cost -- Part-Time Researcher
 *
 * These expected values are hand-calculated and expert-validated.
 * If a test fails, the code is wrong -- not the test.
 *
 * Researcher: Dr James Okafor
 *   - 0.8 FTE, 37.5 contracted hours/week
 *   - Annual salary: £45,000 (already pro-rated for part-time)
 *
 * Grant: EP/T023456/1
 *   - Funded FTE: 0.3
 *
 * UKRI methodology (fEC at 80%):
 *   1. Contracted monthly hours = (37.5 x 52) / 12 = 162.50
 *   2. Effort % = project hours / 162.50
 *   3. Monthly salary = £45,000 / 12 = £3,750.00
 *   4. Salary cost = effort % x monthly salary
 *   5. Claimable = salary cost x 0.80
 *
 * Key principle: for part-time staff, contracted hours and salary are already
 * pro-rated. The calculation uses these values directly -- it does not scale
 * by employmentFraction.
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

const drJamesOkafor: Researcher = {
  id: "researcher-002",
  name: "Dr James Okafor",
  email: "j.okafor@university.ac.uk",
  department: "Chemistry",
  contractedHoursWeekly: 37.5,
  employmentFraction: 0.8,
  annualSalary: 45_000,
  salaryEffectiveDate: new Date("2024-09-01"),
  institutionId: "inst-001",
};

const grantEP: Grant = {
  id: "grant-002",
  funderProfileId: "ukri",
  title: "Sustainable Catalysis Programme",
  reference: "EP/T023456/1",
  startDate: new Date("2024-06-01"),
  endDate: new Date("2027-05-31"),
  fundedFTE: 0.3,
  totalStaffBudget: 120_000,
  principalInvestigatorId: "pi-002",
  institutionId: "inst-001",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Golden: UKRI salary cost -- part-time researcher (0.8 FTE)", () => {
  test("Scenario 1: 40 project hours in October 2025", () => {
    // Hand-calculated worksheet:
    //   monthly hours = (37.5 x 52) / 12 = 162.50
    //   effort        = 40 / 162.50       = 24.62%
    //   monthly salary = 45,000 / 12      = £3,750.00
    //   salary cost   = 0.2462... x 3,750 = £923.08
    //   claimable     = 923.08... x 0.80  = £738.46

    const period: TimesheetPeriod = {
      id: "period-2025-10",
      researcherId: "researcher-002",
      year: 2025,
      month: 10,
      status: "countersigned",
      submittedAt: new Date("2025-11-03"),
      signedAt: new Date("2025-11-04"),
      countersignedAt: new Date("2025-11-05"),
      lockedAt: null,
      entries: [
        {
          id: "entry-010",
          timesheetPeriodId: "period-2025-10",
          grantId: "grant-002",
          hours: 40,
          notes: null,
        },
      ],
    };

    const input: CalculationInput = {
      period,
      researcher: drJamesOkafor,
      grant: grantEP,
      funderProfile: UKRI_PROFILE,
    };

    const result = calculateUKRISalaryCost(input);

    // Core identifiers
    expect(result.grantId).toBe("grant-002");
    expect(result.researcherId).toBe("researcher-002");
    expect(result.periodYear).toBe(2025);
    expect(result.periodMonth).toBe(10);

    // Input echo
    expect(result.projectHours).toBe(40);

    // Step-by-step expected values
    expect(result.contractedMonthlyHours).toBe(162.5);
    expect(result.effortPercentage).toBe(0.2462);
    expect(result.monthlySalary).toBe(3750.0);
    expect(result.salaryCostCharged).toBe(923.08);
    expect(result.fecRate).toBe(0.8);
    expect(result.claimableCost).toBe(738.46);

    // No warnings -- effort (24.62%) is within 125% of funded FTE (30% x 1.25 = 37.5%)
    expect(result.warnings).toHaveLength(0);

    // Part-time note should appear in the monthly salary working step
    const salaryStep = result.workings.find((w) =>
      w.step.includes("monthly salary")
    );
    expect(salaryStep).toBeDefined();
    expect(salaryStep!.notes).toContain("0.8 FTE");
    expect(salaryStep!.notes).toContain("pro-rated");
  });

  test("Scenario 2: zero hours recorded -- should return £0 with warning", () => {
    // When a researcher records zero hours for a grant in a given month,
    // the claimable cost must be exactly £0, and a warning must be raised
    // so that the PI can verify this was intentional (not an omission).

    const period: TimesheetPeriod = {
      id: "period-2025-11",
      researcherId: "researcher-002",
      year: 2025,
      month: 11,
      status: "countersigned",
      submittedAt: new Date("2025-12-03"),
      signedAt: new Date("2025-12-04"),
      countersignedAt: new Date("2025-12-05"),
      lockedAt: null,
      entries: [
        {
          id: "entry-011",
          timesheetPeriodId: "period-2025-11",
          grantId: "grant-002",
          hours: 0,
          notes: "On leave this month",
        },
      ],
    };

    const input: CalculationInput = {
      period,
      researcher: drJamesOkafor,
      grant: grantEP,
      funderProfile: UKRI_PROFILE,
    };

    const result = calculateUKRISalaryCost(input);

    // All monetary values must be exactly zero
    expect(result.projectHours).toBe(0);
    expect(result.effortPercentage).toBe(0);
    expect(result.salaryCostCharged).toBe(0);
    expect(result.claimableCost).toBe(0);

    // Contracted monthly hours and salary are still computed (they are
    // properties of the researcher, not the period)
    expect(result.contractedMonthlyHours).toBe(162.5);
    expect(result.monthlySalary).toBe(3750.0);

    // A warning must be present explaining zero hours
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings).toContain(
      "No hours recorded for this grant in this period. Claimable cost is £0."
    );
  });
});
