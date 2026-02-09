/// <reference types="vitest/globals" />
import type {
  Researcher,
  Grant,
  TimesheetPeriod,
  TimesheetEntry,
  NonGrantEntry,
} from "@compliance/shared-types";
import { validateHoursPlausibility } from "../../src/validation/ukri-ts-004-hours-plausibility";

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

function makeNonGrantEntry(
  overrides: Partial<NonGrantEntry> = {}
): NonGrantEntry {
  return {
    id: "nge1",
    timesheetPeriodId: "tp1",
    category: "teaching",
    hours: 40,
    description: null,
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

describe("UKRI-TS-004: Total hours plausibility", () => {
  // 35 hrs/week -> (35 * 52) / 12 = 151.67 hrs/month
  // ±20% -> lower = 121.33, upper = 182.00
  const researcher = makeResearcher({ contractedHoursWeekly: 35 });
  const grants: Grant[] = [];

  it("passes when total hours within +/-20% of contracted (120-182 hrs)", () => {
    // 80 grant hours + 70 non-grant hours = 150 total -> within range
    const period = makePeriod({
      entries: [makeEntry({ hours: 80 })],
      nonGrantEntries: [makeNonGrantEntry({ hours: 70 })],
    });

    const result = validateHoursPlausibility(period, researcher, grants);

    expect(result.passed).toBe(true);
    expect(result.ruleId).toBe("UKRI-TS-004");
    expect(result.severity).toBe("warning");
  });

  it("warns when hours too low", () => {
    // 50 grant hours + 20 non-grant = 70 total -> below lower bound of ~121
    const period = makePeriod({
      entries: [makeEntry({ hours: 50 })],
      nonGrantEntries: [makeNonGrantEntry({ hours: 20 })],
    });

    const result = validateHoursPlausibility(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("warning");
    expect(result.message).toContain("below");
  });

  it("warns when hours too high", () => {
    // 150 grant hours + 50 non-grant = 200 total -> above upper bound of ~182
    const period = makePeriod({
      entries: [makeEntry({ hours: 150 })],
      nonGrantEntries: [makeNonGrantEntry({ hours: 50 })],
    });

    const result = validateHoursPlausibility(period, researcher, grants);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("warning");
    expect(result.message).toContain("exceed");
  });
});
