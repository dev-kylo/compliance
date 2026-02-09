/// <reference types="vitest/globals" />

import type {
  TimesheetPeriod,
  Researcher,
  Grant,
  FunderProfile,
} from "@compliance/shared-types";
import { UKRI_PROFILE } from "../../src/funder-profiles/ukri";
import { calculateGrantTotal } from "../../src/calculation/grant-total";

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function makeResearcher(overrides: Partial<Researcher> = {}): Researcher {
  return {
    id: "r-1",
    name: "Dr Ada Lovelace",
    email: "ada@example.ac.uk",
    department: "Computer Science",
    contractedHoursWeekly: 35,
    employmentFraction: 1,
    annualSalary: 50_000,
    salaryEffectiveDate: new Date("2025-01-01"),
    institutionId: "inst-1",
    ...overrides,
  };
}

function makeGrant(overrides: Partial<Grant> = {}): Grant {
  return {
    id: "g-1",
    funderProfileId: "ukri",
    title: "Test Grant",
    reference: "EP/X000001/1",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2027-12-31"),
    fundedFTE: 0.5,
    totalStaffBudget: 120_000,
    principalInvestigatorId: "pi-1",
    institutionId: "inst-1",
    ...overrides,
  };
}

function makePeriod(
  researcherId: string,
  year: number,
  month: number,
  grantId: string,
  hours: number
): TimesheetPeriod {
  const id = `tp-${researcherId}-${year}-${month}`;
  return {
    id,
    researcherId,
    year,
    month,
    status: "draft",
    submittedAt: null,
    signedAt: null,
    countersignedAt: null,
    lockedAt: null,
    entries: [
      {
        id: `e-${id}`,
        timesheetPeriodId: id,
        grantId,
        hours,
        notes: null,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("calculateGrantTotal", () => {
  it("aggregates across multiple researchers correctly", () => {
    const grant = makeGrant();

    const researcher1 = makeResearcher({
      id: "r-1",
      name: "Dr Ada Lovelace",
      annualSalary: 50_000,
      contractedHoursWeekly: 35,
    });
    const researcher2 = makeResearcher({
      id: "r-2",
      name: "Dr Charles Babbage",
      annualSalary: 60_000,
      contractedHoursWeekly: 37.5,
    });

    const periods: TimesheetPeriod[] = [
      makePeriod("r-1", 2025, 1, "g-1", 20),
      makePeriod("r-1", 2025, 2, "g-1", 25),
      makePeriod("r-2", 2025, 1, "g-1", 30),
    ];

    const result = calculateGrantTotal(
      grant,
      periods,
      [researcher1, researcher2],
      UKRI_PROFILE
    );

    // Both researchers should contribute
    expect(result.byResearcher).toHaveLength(2);

    // Total should be the sum of all individual claimable costs
    const sumFromBreakdown = result.byResearcher.reduce(
      (sum, r) => sum + r.totalClaimable,
      0
    );
    expect(result.totalClaimableCost).toBeCloseTo(sumFromBreakdown, 2);

    // Total must be positive since we have real hours
    expect(result.totalClaimableCost).toBeGreaterThan(0);

    // Grant identifiers
    expect(result.grantId).toBe("g-1");
    expect(result.grantReference).toBe("EP/X000001/1");
  });

  it("returns per-researcher breakdown", () => {
    const grant = makeGrant();

    const researcher1 = makeResearcher({ id: "r-1", name: "Dr Ada Lovelace" });
    const researcher2 = makeResearcher({
      id: "r-2",
      name: "Dr Charles Babbage",
      annualSalary: 60_000,
    });

    const periods: TimesheetPeriod[] = [
      makePeriod("r-1", 2025, 1, "g-1", 20),
      makePeriod("r-2", 2025, 1, "g-1", 15),
    ];

    const result = calculateGrantTotal(
      grant,
      periods,
      [researcher1, researcher2],
      UKRI_PROFILE
    );

    expect(result.byResearcher).toHaveLength(2);

    const ada = result.byResearcher.find((r) => r.researcherId === "r-1");
    const charles = result.byResearcher.find((r) => r.researcherId === "r-2");

    expect(ada).toBeDefined();
    expect(ada!.researcherName).toBe("Dr Ada Lovelace");
    expect(ada!.totalClaimable).toBeGreaterThan(0);
    expect(ada!.monthlyBreakdown).toHaveLength(1);

    expect(charles).toBeDefined();
    expect(charles!.researcherName).toBe("Dr Charles Babbage");
    expect(charles!.totalClaimable).toBeGreaterThan(0);
    expect(charles!.monthlyBreakdown).toHaveLength(1);
  });

  it("calculates budget utilisation percentage", () => {
    const grant = makeGrant({ totalStaffBudget: 100_000 });
    const researcher = makeResearcher();

    const periods: TimesheetPeriod[] = [
      makePeriod("r-1", 2025, 1, "g-1", 20),
    ];

    const result = calculateGrantTotal(
      grant,
      periods,
      [researcher],
      UKRI_PROFILE
    );

    // percentBudgetUsed should be (totalClaimableCost / totalStaffBudget) * 100
    const expectedPercent =
      Math.round((result.totalClaimableCost / 100_000) * 10000) / 100;
    expect(result.percentBudgetUsed).toBeCloseTo(expectedPercent, 2);
    expect(result.totalStaffBudget).toBe(100_000);

    // The workings should contain a budget utilisation step
    const budgetWorking = result.workings.find((w) =>
      w.step.includes("Budget utilisation")
    );
    expect(budgetWorking).toBeDefined();
    expect(budgetWorking!.result).toBeCloseTo(expectedPercent, 2);
  });

  it("handles periods with no entries for the grant", () => {
    const grant = makeGrant({ id: "g-1" });
    const researcher = makeResearcher();

    // Period has entries only for a different grant
    const periodWithDifferentGrant: TimesheetPeriod = {
      id: "tp-other",
      researcherId: "r-1",
      year: 2025,
      month: 4,
      status: "draft",
      submittedAt: null,
      signedAt: null,
      countersignedAt: null,
      lockedAt: null,
      entries: [
        {
          id: "e-other",
          timesheetPeriodId: "tp-other",
          grantId: "g-other",
          hours: 40,
          notes: null,
        },
      ],
    };

    const result = calculateGrantTotal(
      grant,
      [periodWithDifferentGrant],
      [researcher],
      UKRI_PROFILE
    );

    expect(result.totalClaimableCost).toBe(0);
    expect(result.byResearcher).toHaveLength(0);
    expect(result.percentBudgetUsed).toBe(0);
  });
});
