/// <reference types="vitest/globals" />
import type {
  Researcher,
  Grant,
  TimesheetPeriod,
  TimesheetEntry,
} from "@compliance/shared-types";
import { validateCombinedFTECap } from "../../src/validation/ukri-ts-007-combined-fte-cap";

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
    hours: 75,
    notes: null,
    ...overrides,
  };
}

function makePeriod(
  overrides: Partial<TimesheetPeriod> = {}
): TimesheetPeriod {
  return {
    id: "tp1",
    researcherId: "r1",
    year: 2024,
    month: 6,
    status: "submitted",
    submittedAt: new Date("2024-07-05"),
    signedAt: new Date("2024-07-06"),
    countersignedAt: new Date("2024-07-07"),
    lockedAt: null,
    entries: [],
    ...overrides,
  };
}

describe("UKRI-TS-007: Combined FTE cap", () => {
  // 35 hrs/week -> (35 * 52) / 12 = 151.67 hrs/month (1.0 FTE)

  it("passes when combined FTE under employment fraction", () => {
    const researcher = makeResearcher({
      contractedHoursWeekly: 35,
      employmentFraction: 1.0,
    });
    // Grant A: 75 hrs -> 75 / 151.67 = ~0.494 FTE
    // Grant B: 60 hrs -> 60 / 151.67 = ~0.396 FTE
    // Total: ~0.89 FTE -> under 1.0
    const grants = [
      makeGrant({ id: "g1", reference: "UKRI-001" }),
      makeGrant({ id: "g2", reference: "UKRI-002" }),
    ];
    const period = makePeriod({
      entries: [
        makeEntry({ id: "e1", grantId: "g1", hours: 75 }),
        makeEntry({ id: "e2", grantId: "g2", hours: 60 }),
      ],
    });

    const result = validateCombinedFTECap(period, researcher, grants);

    expect(result.passed).toBe(true);
    expect(result.ruleId).toBe("UKRI-TS-007");
    expect(result.severity).toBe("error");
  });

  it("fails when combined grant FTE exceeds employment fraction", () => {
    const researcher = makeResearcher({
      contractedHoursWeekly: 35,
      employmentFraction: 1.0,
    });
    // Grant A: 100 hrs -> ~0.659 FTE
    // Grant B: 80 hrs  -> ~0.527 FTE
    // Total: ~1.186 FTE -> exceeds 1.0
    const grants = [
      makeGrant({ id: "g1", reference: "UKRI-001" }),
      makeGrant({ id: "g2", reference: "UKRI-002" }),
    ];
    const period = makePeriod({
      entries: [
        makeEntry({ id: "e1", grantId: "g1", hours: 100 }),
        makeEntry({ id: "e2", grantId: "g2", hours: 80 }),
      ],
    });

    const result = validateCombinedFTECap(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("exceeds");
  });
});
