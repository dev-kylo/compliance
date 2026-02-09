/// <reference types="vitest/globals" />
import type {
  Researcher,
  Grant,
  TimesheetPeriod,
} from "@compliance/shared-types";
import { validateImmutability } from "../../src/validation/ukri-ts-008-immutability";

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

describe("UKRI-TS-008: Immutability verification", () => {
  const researcher = makeResearcher();
  const grants: Grant[] = [];

  it("passes for non-locked periods (check not applicable)", () => {
    const period = makePeriod({ status: "submitted" });

    const result = validateImmutability(period, researcher, grants);

    expect(result.passed).toBe(true);
    expect(result.ruleId).toBe("UKRI-TS-008");
    expect(result.message).toContain("not locked");
    expect(result.details.isLocked).toBe(false);
  });

  it("passes for properly locked period with all timestamps", () => {
    const period = makePeriod({
      status: "locked",
      submittedAt: new Date("2024-07-05"),
      signedAt: new Date("2024-07-06"),
      countersignedAt: new Date("2024-07-07"),
      lockedAt: new Date("2024-07-08"),
    });

    const result = validateImmutability(period, researcher, grants);

    expect(result.passed).toBe(true);
    expect(result.message).toContain("integrity verified");
    expect(result.details.isLocked).toBe(true);
  });

  it("fails when locked but missing lock timestamp", () => {
    const period = makePeriod({
      status: "locked",
      submittedAt: new Date("2024-07-05"),
      signedAt: new Date("2024-07-06"),
      countersignedAt: new Date("2024-07-07"),
      lockedAt: null,
    });

    const result = validateImmutability(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("error");
    expect(result.message).toContain("lockedAt timestamp");
    expect(result.details.hasLockTimestamp).toBe(false);
  });

  it("fails when locked but missing signatures", () => {
    const period = makePeriod({
      status: "locked",
      submittedAt: new Date("2024-07-05"),
      signedAt: null,
      countersignedAt: null,
      lockedAt: new Date("2024-07-08"),
    });

    const result = validateImmutability(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("error");
    expect(result.message).toContain("signatures");
    expect(result.details.hasRequiredSignatures).toBe(false);
  });
});
