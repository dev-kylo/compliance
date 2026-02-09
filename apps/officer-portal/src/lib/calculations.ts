import {
  calculateUKRISalaryCost,
  calculateGrantTotal,
  calculateBurnRate,
  validateTimesheetPeriod,
  UKRI_PROFILE,
} from "@compliance/rules-engine";
import type {
  Researcher,
  Grant,
  TimesheetPeriod,
  NonGrantEntry,
  CalculationResult,
  ValidationResult,
} from "@compliance/shared-types";

// Convert Prisma DB types to rules engine domain types
export function toResearcherDomain(dbResearcher: {
  id: string;
  name: string;
  email: string;
  department: string;
  contractedHoursWeekly: number;
  employmentFraction: number;
  annualSalary: number;
  salaryEffectiveDate: Date;
  institutionId: string;
}): Researcher {
  return {
    id: dbResearcher.id,
    name: dbResearcher.name,
    email: dbResearcher.email,
    department: dbResearcher.department,
    contractedHoursWeekly: dbResearcher.contractedHoursWeekly,
    employmentFraction: dbResearcher.employmentFraction,
    annualSalary: dbResearcher.annualSalary,
    salaryEffectiveDate: dbResearcher.salaryEffectiveDate,
    institutionId: dbResearcher.institutionId,
  };
}

export function toGrantDomain(dbGrant: {
  id: string;
  funderProfileId: string;
  title: string;
  reference: string;
  startDate: Date;
  endDate: Date;
  totalStaffBudget: number;
  principalInvestigatorId: string;
  institutionId: string;
}, fundedFTE: number): Grant {
  return {
    id: dbGrant.id,
    funderProfileId: dbGrant.funderProfileId,
    title: dbGrant.title,
    reference: dbGrant.reference,
    startDate: dbGrant.startDate,
    endDate: dbGrant.endDate,
    fundedFTE,
    totalStaffBudget: dbGrant.totalStaffBudget,
    principalInvestigatorId: dbGrant.principalInvestigatorId,
    institutionId: dbGrant.institutionId,
  };
}

export function toPeriodDomain(dbPeriod: {
  id: string;
  researcherId: string;
  year: number;
  month: number;
  status: string;
  submittedAt: Date | null;
  signedAt: Date | null;
  countersignedAt: Date | null;
  lockedAt: Date | null;
  entries: { id: string; timesheetPeriodId: string; grantId: string; hours: number; notes: string | null }[];
  nonGrantEntries?: { id: string; timesheetPeriodId: string; category: string; hours: number; description: string | null }[];
}): TimesheetPeriod {
  return {
    id: dbPeriod.id,
    researcherId: dbPeriod.researcherId,
    year: dbPeriod.year,
    month: dbPeriod.month,
    status: dbPeriod.status.toLowerCase() as TimesheetPeriod["status"],
    submittedAt: dbPeriod.submittedAt,
    signedAt: dbPeriod.signedAt,
    countersignedAt: dbPeriod.countersignedAt,
    lockedAt: dbPeriod.lockedAt,
    entries: dbPeriod.entries.map(e => ({
      id: e.id,
      timesheetPeriodId: e.timesheetPeriodId,
      grantId: e.grantId,
      hours: e.hours,
      notes: e.notes,
    })),
    nonGrantEntries: (dbPeriod.nonGrantEntries ?? []).map(e => ({
      id: e.id,
      timesheetPeriodId: e.timesheetPeriodId,
      category: e.category.toLowerCase() as NonGrantEntry["category"],
      hours: e.hours,
      description: e.description,
    })),
  };
}

export function runValidation(
  dbPeriod: Parameters<typeof toPeriodDomain>[0],
  dbResearcher: Parameters<typeof toResearcherDomain>[0],
  dbGrants: (Parameters<typeof toGrantDomain>[0] & { fundedFTE?: number })[],
  allDbPeriods?: Parameters<typeof toPeriodDomain>[0][]
): ValidationResult[] {
  const period = toPeriodDomain(dbPeriod);
  const researcher = toResearcherDomain(dbResearcher);
  const grants = dbGrants.map(g => toGrantDomain(g, g.fundedFTE ?? 0));
  const allPeriods = allDbPeriods?.map(toPeriodDomain);
  return validateTimesheetPeriod(period, researcher, grants, allPeriods);
}

export function runCalculation(
  dbPeriod: Parameters<typeof toPeriodDomain>[0],
  dbResearcher: Parameters<typeof toResearcherDomain>[0],
  dbGrant: Parameters<typeof toGrantDomain>[0],
  fundedFTE: number
): CalculationResult {
  return calculateUKRISalaryCost({
    period: toPeriodDomain(dbPeriod),
    researcher: toResearcherDomain(dbResearcher),
    grant: toGrantDomain(dbGrant, fundedFTE),
    funderProfile: UKRI_PROFILE,
  });
}

export { calculateGrantTotal, calculateBurnRate, UKRI_PROFILE };
