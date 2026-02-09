import type { ValidationRule } from "@compliance/shared-types";

/**
 * UKRI-TS-002: Signature present
 *
 * Period must have researcher signature (signedAt) and PI countersignature
 * (countersignedAt). Unsigned timesheets = costs disallowed.
 */
export const validateSignature: ValidationRule = (period) => {
  const hasResearcherSignature = period.signedAt !== null;
  const hasPICountersignature = period.countersignedAt !== null;
  const passed = hasResearcherSignature && hasPICountersignature;

  let message: string;
  if (passed) {
    message = "Timesheet is signed by researcher and countersigned by PI.";
  } else if (!hasResearcherSignature && !hasPICountersignature) {
    message =
      "Timesheet is missing both researcher signature and PI countersignature.";
  } else if (!hasResearcherSignature) {
    message = "Timesheet is missing researcher signature.";
  } else {
    message = "Timesheet is missing PI countersignature.";
  }

  return {
    ruleId: "UKRI-TS-002",
    ruleName: "Signature present",
    funderClause:
      "UKRI Terms and Conditions of Grant, Section: Expenditure — time records must be signed by the researcher and countersigned by the Principal Investigator",
    severity: "error",
    passed,
    message,
    details: {
      hasResearcherSignature,
      hasPICountersignature,
      signedAt: period.signedAt,
      countersignedAt: period.countersignedAt,
    },
  };
};
