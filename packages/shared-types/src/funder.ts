export type FunderMethodology =
  | "percentage_of_salary"
  | "half_day_rate"
  | "quarterly_total";

export interface FunderProfile {
  id: string;
  name: string;
  fecRate: number | null;
  calculationMethod: FunderMethodology;
  timeCapture: "project_only" | "all_working_time";
  periodGranularity: "daily" | "weekly" | "monthly";
  requiresPISignature: boolean;
  submissionDeadlineDays: number;
  workingDaysPerYear?: number;
  notes: string;
}
