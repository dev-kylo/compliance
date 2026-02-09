/// <reference types="vitest/globals" />
import type {
  Researcher,
  Grant,
  TimesheetPeriod,
} from "@compliance/shared-types";
import { validateSignature } from "../../src/validation/ukri-ts-002-signature";

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
    status: "countersigned",
    submittedAt: new Date("2024-07-05"),
    signedAt: new Date("2024-07-06"),
    countersignedAt: new Date("2024-07-07"),
    lockedAt: null,
    entries: [],
    ...overrides,
  };
}

describe("UKRI-TS-002: Signature present", () => {
  const researcher = makeResearcher();
  const grants: Grant[] = [];

  it("passes when both signatures present", () => {
    const period = makePeriod({
      signedAt: new Date("2024-07-06"),
      countersignedAt: new Date("2024-07-07"),
    });

    const result = validateSignature(period, researcher, grants);

    expect(result.passed).toBe(true);
    expect(result.ruleId).toBe("UKRI-TS-002");
    expect(result.severity).toBe("error");
    expect(result.details.hasResearcherSignature).toBe(true);
    expect(result.details.hasPICountersignature).toBe(true);
  });

  it("fails when researcher signature missing", () => {
    const period = makePeriod({
      signedAt: null,
      countersignedAt: new Date("2024-07-07"),
    });

    const result = validateSignature(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("researcher signature");
    expect(result.details.hasResearcherSignature).toBe(false);
    expect(result.details.hasPICountersignature).toBe(true);
  });

  it("fails when PI countersignature missing", () => {
    const period = makePeriod({
      signedAt: new Date("2024-07-06"),
      countersignedAt: null,
    });

    const result = validateSignature(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("PI countersignature");
    expect(result.details.hasResearcherSignature).toBe(true);
    expect(result.details.hasPICountersignature).toBe(false);
  });

  it("fails when both missing", () => {
    const period = makePeriod({
      signedAt: null,
      countersignedAt: null,
    });

    const result = validateSignature(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("both");
    expect(result.details.hasResearcherSignature).toBe(false);
    expect(result.details.hasPICountersignature).toBe(false);
  });
});
