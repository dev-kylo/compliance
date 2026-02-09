export interface Researcher {
  id: string;
  name: string;
  email: string;
  department: string;
  contractedHoursWeekly: number;
  employmentFraction: number;
  annualSalary: number;
  salaryEffectiveDate: Date;
  institutionId: string;
}

export interface Grant {
  id: string;
  funderProfileId: string;
  title: string;
  reference: string;
  startDate: Date;
  endDate: Date;
  fundedFTE: number;
  totalStaffBudget: number;
  principalInvestigatorId: string;
  institutionId: string;
}

export type TimesheetStatus =
  | "draft"
  | "submitted"
  | "signed"
  | "countersigned"
  | "locked";

export interface TimesheetPeriod {
  id: string;
  researcherId: string;
  year: number;
  month: number;
  status: TimesheetStatus;
  submittedAt: Date | null;
  signedAt: Date | null;
  countersignedAt: Date | null;
  lockedAt: Date | null;
  entries: TimesheetEntry[];
  nonGrantEntries?: NonGrantEntry[];
}

export interface TimesheetEntry {
  id: string;
  timesheetPeriodId: string;
  grantId: string;
  hours: number;
  notes: string | null;
}

export type NonGrantCategory =
  | "teaching"
  | "admin"
  | "other_research"
  | "leave"
  | "other";

export interface NonGrantEntry {
  id: string;
  timesheetPeriodId: string;
  category: NonGrantCategory;
  hours: number;
  description: string | null;
}
