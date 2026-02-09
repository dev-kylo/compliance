/// <reference types="vitest/globals" />
import type {
  Researcher,
  Grant,
  TimesheetPeriod,
  TimesheetEntry,
} from "@compliance/shared-types";
import { validateFTEConsistency } from "../../src/validation/ukri-ts-006-fte-consistency";

function makeResearcher(overrides: Partial<Researcher> = {}): Researcher {
  return {
    id: "r1",
    name: "Dr Test",
    email: "test@test.ac.uk",
    department: "Testing",
    contractedHoursWeekly: 35,
    employmentFraction: 1.0,
    annualSalary: 50000,
    salaryEffectiveDate: new Date("2024-01-01"),
    institutionId: "inst1",
    ...overrides,
  };
}

function makeGrant(overrides: Partial<Grant> = {}): Grant {
  return {
    id: "g1",
    funderProfileId: "ukri",
    title: "Test Grant",
    reference: "UKRI-001",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    fundedFTE: 0.5,
    totalStaffBudget: 25000,
    principalInvestigatorId: "pi1",
    institutionId: "inst1",
    ...overrides,
  };
}

function makeEntry(overrides: Partial<TimesheetEntry> = {}): TimesheetEntry {
  return {
    id: "e1",
    timesheetPeriodId: "tp1",
    grantId: "g1",
    hours: 75.83,
    notes: null,
    ...overrides,
  };
}

/**
 * Build a set of monthly periods for testing the rolling window.
 * 35 hrs/week -> (35 * 52) / 12 = 151.67 hrs/month
 * At 0.5 FTE, that's ~75.83 hrs/month.
 */
function buildMonthlyPeriods(
  months: { year: number; month: number; grantHours: number }[],
  grantId: string
): TimesheetPeriod[] {
  return months.map((m, i) => ({
    id: `tp-${i}`,
    researcherId: "r1",
    year: m.year,
    month: m.month,
    status: "submitted" as const,
    submittedAt: new Date(m.year, m.month, 5),
    signedAt: new Date(m.year, m.month, 6),
    countersignedAt: new Date(m.year, m.month, 7),
    lockedAt: null,
    entries: [
      {
        id: `e-${i}`,
        timesheetPeriodId: `tp-${i}`,
        grantId,
        hours: m.grantHours,
        notes: null,
      },
    ],
  }));
}

describe("UKRI-TS-006: FTE consistency", () => {
  // 35 hrs/week -> 151.67 hrs/month contracted
  const researcher = makeResearcher({ contractedHoursWeekly: 35 });

  it("passes with consistent allocation over 6 months", () => {
    const grant = makeGrant({ id: "g1", fundedFTE: 0.5 });
    // 0.5 FTE of 151.67 = ~75.83 hrs/month — consistent across 6 months
    const allPeriods = buildMonthlyPeriods(
      [
        { year: 2024, month: 1, grantHours: 76 },
        { year: 2024, month: 2, grantHours: 75 },
        { year: 2024, month: 3, grantHours: 77 },
        { year: 2024, month: 4, grantHours: 74 },
        { year: 2024, month: 5, grantHours: 76 },
        { year: 2024, month: 6, grantHours: 75 },
      ],
      "g1"
    );
    const currentPeriod = allPeriods[5];

    const result = validateFTEConsistency(
      currentPeriod,
      researcher,
      [grant],
      allPeriods
    );

    expect(result.passed).toBe(true);
    expect(result.ruleId).toBe("UKRI-TS-006");
    expect(result.severity).toBe("warning");
  });

  it("warns when consistently over-allocated", () => {
    // fundedFTE = 0.3 -> expected ~45.5 hrs/month
    // Upper bound = 0.3 * 1.25 = 0.375 FTE -> ~56.88 hrs
    // Providing ~76 hrs/month -> FTE ~0.5, well above 0.375
    const grant = makeGrant({ id: "g1", fundedFTE: 0.3 });
    const allPeriods = buildMonthlyPeriods(
      [
        { year: 2024, month: 1, grantHours: 76 },
        { year: 2024, month: 2, grantHours: 75 },
        { year: 2024, month: 3, grantHours: 77 },
        { year: 2024, month: 4, grantHours: 74 },
        { year: 2024, month: 5, grantHours: 76 },
        { year: 2024, month: 6, grantHours: 75 },
      ],
      "g1"
    );
    const currentPeriod = allPeriods[5];

    const result = validateFTEConsistency(
      currentPeriod,
      researcher,
      [grant],
      allPeriods
    );

    expect(result.passed).toBe(false);
    expect(result.message).toContain("over-allocated");
  });

  it("warns when consistently under-allocated", () => {
    // fundedFTE = 0.5 -> expected ~75.83 hrs/month
    // Lower bound = 0.5 * 0.75 = 0.375 FTE -> ~56.88 hrs
    // Providing ~20 hrs/month -> FTE ~0.13, well below 0.375
    const grant = makeGrant({ id: "g1", fundedFTE: 0.5 });
    const allPeriods = buildMonthlyPeriods(
      [
        { year: 2024, month: 1, grantHours: 20 },
        { year: 2024, month: 2, grantHours: 22 },
        { year: 2024, month: 3, grantHours: 18 },
        { year: 2024, month: 4, grantHours: 21 },
        { year: 2024, month: 5, grantHours: 19 },
        { year: 2024, month: 6, grantHours: 20 },
      ],
      "g1"
    );
    const currentPeriod = allPeriods[5];

    const result = validateFTEConsistency(
      currentPeriod,
      researcher,
      [grant],
      allPeriods
    );

    expect(result.passed).toBe(false);
    expect(result.message).toContain("under-allocated");
  });

  it("skips check when fewer than 3 months of data", () => {
    const grant = makeGrant({ id: "g1", fundedFTE: 0.5 });
    // Only 2 months of data — too few for consistency check
    const allPeriods = buildMonthlyPeriods(
      [
        { year: 2024, month: 5, grantHours: 20 },
        { year: 2024, month: 6, grantHours: 20 },
      ],
      "g1"
    );
    const currentPeriod = allPeriods[1];

    const result = validateFTEConsistency(
      currentPeriod,
      researcher,
      [grant],
      allPeriods
    );

    // With fewer than 3 months, the rule skips the grant and passes
    expect(result.passed).toBe(true);
  });
});
