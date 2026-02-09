import type {
  Grant,
  Researcher,
  TimesheetPeriod,
  ValidationResult,
  ValidationRule,
} from "@compliance/shared-types";

import { validateCompleteness } from "./ukri-ts-001-completeness";
import { validateSignature } from "./ukri-ts-002-signature";
import { validateTimeliness } from "./ukri-ts-003-timeliness";
import { validateHoursPlausibility } from "./ukri-ts-004-hours-plausibility";
import { validateGrantBoundary } from "./ukri-ts-005-grant-boundary";
import { validateFTEConsistency } from "./ukri-ts-006-fte-consistency";
import { validateCombinedFTECap } from "./ukri-ts-007-combined-fte-cap";
import { validateImmutability } from "./ukri-ts-008-immutability";

export const UKRI_VALIDATION_RULES: ValidationRule[] = [
  validateCompleteness,
  validateSignature,
  validateTimeliness,
  validateHoursPlausibility,
  validateGrantBoundary,
  validateFTEConsistency,
  validateCombinedFTECap,
  validateImmutability,
];

/**
 * Run all UKRI validation rules against a timesheet period.
 */
export function validateTimesheetPeriod(
  period: TimesheetPeriod,
  researcher: Researcher,
  grants: Grant[],
  allPeriods?: TimesheetPeriod[]
): ValidationResult[] {
  return UKRI_VALIDATION_RULES.map((rule) =>
    rule(period, researcher, grants, allPeriods)
  );
}

/**
 * Run all validations and return only failures.
 */
export function getValidationErrors(
  period: TimesheetPeriod,
  researcher: Researcher,
  grants: Grant[],
  allPeriods?: TimesheetPeriod[]
): ValidationResult[] {
  return validateTimesheetPeriod(period, researcher, grants, allPeriods).filter(
    (r) => !r.passed
  );
}

/**
 * Check if a timesheet period passes all critical (error-severity) rules.
 */
export function isCompliant(
  period: TimesheetPeriod,
  researcher: Researcher,
  grants: Grant[],
  allPeriods?: TimesheetPeriod[]
): boolean {
  const results = validateTimesheetPeriod(
    period,
    researcher,
    grants,
    allPeriods
  );
  return results
    .filter((r) => r.severity === "error")
    .every((r) => r.passed);
}

export {
  validateCompleteness,
  validateSignature,
  validateTimeliness,
  validateHoursPlausibility,
  validateGrantBoundary,
  validateFTEConsistency,
  validateCombinedFTECap,
  validateImmutability,
};
