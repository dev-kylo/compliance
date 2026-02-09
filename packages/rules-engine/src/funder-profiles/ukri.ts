import type { FunderProfile } from "@compliance/shared-types";

export const UKRI_PROFILE: FunderProfile = {
  id: "ukri",
  name: "UK Research & Innovation",
  fecRate: 0.8,
  calculationMethod: "percentage_of_salary",
  timeCapture: "all_working_time",
  periodGranularity: "monthly",
  requiresPISignature: true,
  submissionDeadlineDays: 10,
  notes:
    "UKRI funds at 80% of full Economic Cost (fEC). Researchers must record all working time, not just project time. Monthly timesheets require researcher signature and PI countersignature. Salary costs are calculated as a percentage of contracted hours apportioned to the grant.",
};
