// Funder profiles
export {
  getFunderProfile,
  getAllFunderProfiles,
  UKRI_PROFILE,
} from "./funder-profiles";

// Validation
export {
  validateTimesheetPeriod,
  getValidationErrors,
  isCompliant,
  UKRI_VALIDATION_RULES,
  validateCompleteness,
  validateSignature,
  validateTimeliness,
  validateHoursPlausibility,
  validateGrantBoundary,
  validateFTEConsistency,
  validateCombinedFTECap,
  validateImmutability,
} from "./validation";

// Calculations
export {
  calculateUKRISalaryCost,
  calculateGrantTotal,
  calculateBurnRate,
} from "./calculation";

// State machine
export {
  validateStatusTransition,
  getNextStatus,
  canTransitionTo,
  STATUS_TRANSITIONS,
} from "./state-machine";
