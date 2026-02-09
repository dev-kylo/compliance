import type { FunderProfile } from "./funder";
import type { Grant, Researcher, TimesheetPeriod } from "./domain";

export interface CalculationInput {
  period: TimesheetPeriod;
  researcher: Researcher;
  grant: Grant;
  funderProfile: FunderProfile;
}

export interface CalculationWorkings {
  step: string;
  formula: string;
  result: number;
  notes?: string;
}

export interface CalculationResult {
  grantId: string;
  researcherId: string;
  periodYear: number;
  periodMonth: number;
  projectHours: number;
  contractedMonthlyHours: number;
  effortPercentage: number;
  monthlySalary: number;
  salaryCostCharged: number;
  fecRate: number | null;
  claimableCost: number;
  workings: CalculationWorkings[];
  warnings: string[];
}

export interface GrantTotalResult {
  grantId: string;
  grantReference: string;
  totalClaimableCost: number;
  totalStaffBudget: number;
  percentBudgetUsed: number;
  byResearcher: {
    researcherId: string;
    researcherName: string;
    totalClaimable: number;
    monthlyBreakdown: CalculationResult[];
  }[];
  workings: CalculationWorkings[];
}

export interface BurnRateResult {
  grantId: string;
  grantReference: string;
  totalStaffBudget: number;
  totalClaimedToDate: number;
  monthsElapsed: number;
  monthsRemaining: number;
  averageMonthlyBurn: number;
  projectedTotalCost: number;
  projectedOverUnderSpend: number;
  burnRateStatus: "on_track" | "underspending" | "overspending";
  workings: CalculationWorkings[];
}
