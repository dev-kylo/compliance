/// <reference types="vitest/globals" />

/**
 * Golden Test: UKRI Salary Cost -- Basic Full-Time Researcher
 *
 * These expected values are hand-calculated and expert-validated.
 * If a test fails, the code is wrong -- not the test.
 *
 * Researcher: Dr Sarah Chen
 *   - Full-time (1.0 FTE), 35 contracted hours/week
 *   - Annual salary: £52,000
 *
 * Grant: EP/T023456/1
 *   - Funded FTE: 0.4
 *
 * UKRI methodology (fEC at 80%):
 *   1. Contracted monthly hours = (35 x 52) / 12 = 151.67
 *   2. Effort % = project hours / 151.67
 *   3. Monthly salary = £52,000 / 12 = £4,333.33
 *   4. Salary cost = effort % x monthly salary
 *   5. Claimable = salary cost x 0.80
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

describe("Golden: UKRI salary cost -- full-time researcher", () => {
  test("Scenario 1: standard month with 14 project hours (October 2025)", () => {
    // Hand-calculated worksheet:
    //   monthly hours = (35 x 52) / 12 = 151.67
    //   effort        = 14 / 151.6667  = 9.23%
    //   monthly salary = 52,000 / 12   = £4,333.33
    //   salary cost   = 0.0923... x 4,333.33... = £400.00
    //   claimable     = 400.00 x 0.80  = £320.00

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
          id: "entry-001",
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

    // Core identifiers
    expect(result.grantId).toBe("grant-001");
    expect(result.researcherId).toBe("researcher-001");
    expect(result.periodYear).toBe(2025);
    expect(result.periodMonth).toBe(10);

    // Input echo
    expect(result.projectHours).toBe(14);

    // Step-by-step expected values
    expect(result.contractedMonthlyHours).toBe(151.67);
    expect(result.effortPercentage).toBe(0.0923);
    expect(result.monthlySalary).toBe(4333.33);
    expect(result.salaryCostCharged).toBe(400.0);
    expect(result.fecRate).toBe(0.8);
    expect(result.claimableCost).toBe(320.0);

    // No warnings expected -- effort (9.23%) is well within funded FTE (40%)
    expect(result.warnings).toHaveLength(0);
  });

  test("Scenario 2: higher-allocation month with 60 project hours (November 2025)", () => {
    // Hand-calculated worksheet:
    //   monthly hours = (35 x 52) / 12 = 151.67
    //   effort        = 60 / 151.6667  = 39.56%
    //   monthly salary = 52,000 / 12   = £4,333.33
    //   salary cost   = 0.3956... x 4,333.33... = £1,714.29
    //   claimable     = 1,714.29... x 0.80 = £1,371.43

    const period: TimesheetPeriod = {
      id: "period-2025-11",
      researcherId: "researcher-001",
      year: 2025,
      month: 11,
      status: "countersigned",
      submittedAt: new Date("2025-12-03"),
      signedAt: new Date("2025-12-04"),
      countersignedAt: new Date("2025-12-05"),
      lockedAt: null,
      entries: [
        {
          id: "entry-002",
          timesheetPeriodId: "period-2025-11",
          grantId: "grant-001",
          hours: 60,
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

    // Core identifiers
    expect(result.grantId).toBe("grant-001");
    expect(result.researcherId).toBe("researcher-001");
    expect(result.periodYear).toBe(2025);
    expect(result.periodMonth).toBe(11);

    // Input echo
    expect(result.projectHours).toBe(60);

    // Step-by-step expected values
    expect(result.contractedMonthlyHours).toBe(151.67);
    expect(result.effortPercentage).toBe(0.3956);
    expect(result.monthlySalary).toBe(4333.33);
    expect(result.salaryCostCharged).toBe(1714.29);
    expect(result.fecRate).toBe(0.8);
    expect(result.claimableCost).toBe(1371.43);

    // No warnings expected -- effort (39.56%) is within 125% of funded FTE (40% x 1.25 = 50%)
    expect(result.warnings).toHaveLength(0);
  });
});
