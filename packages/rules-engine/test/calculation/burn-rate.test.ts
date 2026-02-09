/// <reference types="vitest/globals" />

import type {
  Grant,
  CalculationResult,
} from "@compliance/shared-types";
import { calculateBurnRate } from "../../src/calculation/burn-rate";

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

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

/**
 * Build a minimal CalculationResult with just the fields that
 * `calculateBurnRate` actually reads (`claimableCost`).
 */
function makeCalcResult(
  claimableCost: number,
  overrides: Partial<CalculationResult> = {}
): CalculationResult {
  return {
    grantId: "g-1",
    researcherId: "r-1",
    periodYear: 2025,
    periodMonth: 1,
    projectHours: 14,
    contractedMonthlyHours: 151.67,
    effortPercentage: 0.0923,
    monthlySalary: 4166.67,
    salaryCostCharged: 384.62,
    fecRate: 0.8,
    claimableCost,
    workings: [],
    warnings: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("calculateBurnRate", () => {
  // Fix "now" so that date-based calculations in the source are predictable.
  // The function uses `new Date()` internally, so we mock it via vi.useFakeTimers.
  beforeEach(() => {
    vi.useFakeTimers();
    // Set "now" to 1 July 2025 — 6 months after grant start (2025-01-01)
    vi.setSystemTime(new Date("2025-07-01"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates average monthly burn rate", () => {
    const grant = makeGrant({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2027-12-31"),
      totalStaffBudget: 120_000,
    });

    // 6 months of results, £300 each = £1,800 total claimed
    const results = Array.from({ length: 6 }, (_, i) =>
      makeCalcResult(300, { periodMonth: i + 1 })
    );

    const burnRate = calculateBurnRate(grant, results);

    // Total claimed = 6 * 300 = 1800
    expect(burnRate.totalClaimedToDate).toBeCloseTo(1800, 2);

    // monthsElapsed should be 6 (July 2025 - Jan 2025)
    expect(burnRate.monthsElapsed).toBe(6);

    // Average monthly burn = 1800 / 6 = 300
    expect(burnRate.averageMonthlyBurn).toBeCloseTo(300, 2);
  });

  it("projects total cost correctly", () => {
    const grant = makeGrant({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2027-12-31"),
      totalStaffBudget: 120_000,
    });

    // 6 monthly results at £300 each
    const results = Array.from({ length: 6 }, (_, i) =>
      makeCalcResult(300, { periodMonth: i + 1 })
    );

    const burnRate = calculateBurnRate(grant, results);

    // Total grant months = (2027 - 2025) * 12 + (11 - 0) = 35
    // (getMonth() is 0-indexed: Dec = 11, Jan = 0)
    const totalGrantMonths = 35;

    // Projected total = averageMonthlyBurn * totalGrantMonths = 300 * 35 = 10,500
    expect(burnRate.projectedTotalCost).toBeCloseTo(300 * totalGrantMonths, 0);

    // Projected over/under = projected - budget = 10,500 - 120,000 = -109,500
    expect(burnRate.projectedOverUnderSpend).toBeCloseTo(
      300 * totalGrantMonths - 120_000,
      0
    );
  });

  it("identifies overspending status", () => {
    const grant = makeGrant({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2027-12-31"),
      totalStaffBudget: 10_000,
    });

    // High burn rate: 6 months at £500 each = £3,000 total
    // Average monthly = 500, projected = 500 * 36 = 18,000
    // Over = 18,000 - 10,000 = 8,000 > tolerance (10,000 * 0.1 = 1,000)
    const results = Array.from({ length: 6 }, (_, i) =>
      makeCalcResult(500, { periodMonth: i + 1 })
    );

    const burnRate = calculateBurnRate(grant, results);

    expect(burnRate.burnRateStatus).toBe("overspending");
  });

  it("identifies underspending status", () => {
    const grant = makeGrant({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2027-12-31"),
      totalStaffBudget: 120_000,
    });

    // Low burn rate: 6 months at £100 each = £600 total
    // Average monthly = 100, projected = 100 * 36 = 3,600
    // Under = 3,600 - 120,000 = -116,400 < -tolerance (-12,000)
    const results = Array.from({ length: 6 }, (_, i) =>
      makeCalcResult(100, { periodMonth: i + 1 })
    );

    const burnRate = calculateBurnRate(grant, results);

    expect(burnRate.burnRateStatus).toBe("underspending");
  });

  it("identifies on-track status", () => {
    const grant = makeGrant({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2027-12-31"),
      totalStaffBudget: 10_800,
    });

    // Perfectly on-track: 6 months at £300 each = £1,800
    // Average monthly = 300, projected = 300 * 36 = 10,800
    // Over/under = 10,800 - 10,800 = 0, within ±10% tolerance
    const results = Array.from({ length: 6 }, (_, i) =>
      makeCalcResult(300, { periodMonth: i + 1 })
    );

    const burnRate = calculateBurnRate(grant, results);

    expect(burnRate.burnRateStatus).toBe("on_track");
  });
});
