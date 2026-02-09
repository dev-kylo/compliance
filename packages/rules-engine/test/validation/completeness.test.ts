/// <reference types="vitest/globals" />
import type {
  Researcher,
  Grant,
  TimesheetPeriod,
  TimesheetEntry,
} from "@compliance/shared-types";
import { validateCompleteness } from "../../src/validation/ukri-ts-001-completeness";

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
    entries: [makeEntry()],
    ...overrides,
  };
}

describe("UKRI-TS-001: Timesheet completeness", () => {
  const researcher = makeResearcher();

  it("passes when all active grants have entries", () => {
    const grants = [
      makeGrant({ id: "g1", reference: "UKRI-001" }),
      makeGrant({ id: "g2", reference: "UKRI-002" }),
    ];
    const period = makePeriod({
      entries: [
        makeEntry({ id: "e1", grantId: "g1" }),
        makeEntry({ id: "e2", grantId: "g2" }),
      ],
    });

    const result = validateCompleteness(period, researcher, grants);

    expect(result.passed).toBe(true);
    expect(result.ruleId).toBe("UKRI-TS-001");
    expect(result.severity).toBe("error");
  });

  it("fails when a grant is missing an entry", () => {
    const grants = [
      makeGrant({ id: "g1", reference: "UKRI-001" }),
      makeGrant({ id: "g2", reference: "UKRI-002" }),
    ];
    const period = makePeriod({
      entries: [makeEntry({ id: "e1", grantId: "g1" })],
    });

    const result = validateCompleteness(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("UKRI-002");
    expect(result.details.missingGrants).toHaveLength(1);
  });

  it("ignores grants outside the period (not yet started or already ended)", () => {
    const grants = [
      makeGrant({
        id: "g1",
        reference: "UKRI-001",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      }),
      // Grant that ended before the period (June 2024)
      makeGrant({
        id: "g-past",
        reference: "UKRI-PAST",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2024-04-30"),
      }),
      // Grant that starts after the period
      makeGrant({
        id: "g-future",
        reference: "UKRI-FUTURE",
        startDate: new Date("2024-08-01"),
        endDate: new Date("2025-12-31"),
      }),
    ];
    const period = makePeriod({
      year: 2024,
      month: 6,
      entries: [makeEntry({ id: "e1", grantId: "g1" })],
    });

    const result = validateCompleteness(period, researcher, grants);

    expect(result.passed).toBe(true);
    expect(result.details.activeGrantCount).toBe(1);
  });

  it("zero hours entry still counts as present", () => {
    const grants = [makeGrant({ id: "g1", reference: "UKRI-001" })];
    const period = makePeriod({
      entries: [makeEntry({ id: "e1", grantId: "g1", hours: 0 })],
    });

    const result = validateCompleteness(period, researcher, grants);

    expect(result.passed).toBe(true);
  });
});
