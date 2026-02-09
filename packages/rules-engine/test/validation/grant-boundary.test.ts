/// <reference types="vitest/globals" />
import type {
  Researcher,
  Grant,
  TimesheetPeriod,
  TimesheetEntry,
} from "@compliance/shared-types";
import { validateGrantBoundary } from "../../src/validation/ukri-ts-005-grant-boundary";

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
    hours: 80,
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

describe("UKRI-TS-005: Grant period boundary", () => {
  const researcher = makeResearcher();

  it("passes when entries are within grant period", () => {
    // Period June 2024, grant runs Jan 2024 - Dec 2024 -> within bounds
    const grants = [makeGrant()];
    const period = makePeriod({
      year: 2024,
      month: 6,
      entries: [makeEntry({ grantId: "g1", hours: 80 })],
    });

    const result = validateGrantBoundary(period, researcher, grants);

    expect(result.passed).toBe(true);
    expect(result.ruleId).toBe("UKRI-TS-005");
    expect(result.severity).toBe("error");
  });

  it("fails when hours allocated after grant end date", () => {
    // Grant ended March 2024, but period is June 2024
    const grants = [
      makeGrant({
        id: "g1",
        reference: "UKRI-ENDED",
        endDate: new Date("2024-03-31"),
      }),
    ];
    const period = makePeriod({
      year: 2024,
      month: 6,
      entries: [makeEntry({ grantId: "g1", hours: 80 })],
    });

    const result = validateGrantBoundary(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("UKRI-ENDED");
    expect((result.details.violations as unknown[]).length).toBe(1);
  });

  it("fails when hours allocated before grant start date", () => {
    // Grant starts September 2024, but period is June 2024
    const grants = [
      makeGrant({
        id: "g1",
        reference: "UKRI-FUTURE",
        startDate: new Date("2024-09-01"),
      }),
    ];
    const period = makePeriod({
      year: 2024,
      month: 6,
      entries: [makeEntry({ grantId: "g1", hours: 80 })],
    });

    const result = validateGrantBoundary(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("UKRI-FUTURE");
  });

  it("zero-hour entries outside boundary still pass (they don't count)", () => {
    // Grant ended March 2024, period is June 2024, but entry has 0 hours
    const grants = [
      makeGrant({
        id: "g1",
        reference: "UKRI-ENDED",
        endDate: new Date("2024-03-31"),
      }),
    ];
    const period = makePeriod({
      year: 2024,
      month: 6,
      entries: [makeEntry({ grantId: "g1", hours: 0 })],
    });

    const result = validateGrantBoundary(period, researcher, grants);

    expect(result.passed).toBe(true);
  });
});
