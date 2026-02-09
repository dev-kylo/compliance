/// <reference types="vitest/globals" />
import type {
  Researcher,
  Grant,
  TimesheetPeriod,
} from "@compliance/shared-types";
import { validateTimeliness } from "../../src/validation/ukri-ts-003-timeliness";

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

describe("UKRI-TS-003: Timeliness of submission", () => {
  const researcher = makeResearcher();
  const grants = [makeGrant()];

  it("passes when submitted on time (within 10 days of period end)", () => {
    // Period is June 2024, ends June 30. Deadline = June 30 + 10 = July 10.
    // Submitted July 5 -> on time.
    const period = makePeriod({
      year: 2024,
      month: 6,
      submittedAt: new Date("2024-07-05"),
    });

    const result = validateTimeliness(period, researcher, grants);

    expect(result.passed).toBe(true);
    expect(result.ruleId).toBe("UKRI-TS-003");
    expect(result.severity).toBe("info");
    expect(result.message).toContain("on time");
  });

  it("warning when submitted late but within 30 days", () => {
    // Period is June 2024, ends June 30. Deadline = July 10.
    // Submitted July 25 -> 15 days late (within 30).
    const period = makePeriod({
      year: 2024,
      month: 6,
      submittedAt: new Date("2024-07-25"),
    });

    const result = validateTimeliness(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("warning");
    expect(result.message).toContain("after the deadline");
  });

  it("error when submitted more than 30 days late", () => {
    // Period is June 2024, ends June 30. Deadline = July 10.
    // Submitted September 1 -> well over 30 days late.
    const period = makePeriod({
      year: 2024,
      month: 6,
      submittedAt: new Date("2024-09-01"),
    });

    const result = validateTimeliness(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("error");
    expect(result.message).toContain("more than 30 days late");
  });

  it("error when not submitted at all", () => {
    const period = makePeriod({
      year: 2024,
      month: 6,
      submittedAt: null,
    });

    const result = validateTimeliness(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("error");
    expect(result.message).toContain("not been submitted");
  });
});
