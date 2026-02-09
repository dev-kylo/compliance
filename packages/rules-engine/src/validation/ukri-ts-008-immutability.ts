import type { ValidationRule } from "@compliance/shared-types";

/**
 * UKRI-TS-008: Immutability verification
 *
 * Once a period status is 'locked', no entries can be modified. This is enforced
 * at the application layer, but the rule verifies data integrity.
 *
 * This rule checks that locked periods have consistent timestamps — the lockedAt
 * date should be set, and no entry modification timestamps should be after the
 * lock date. Since we don't have entry-level timestamps in the base model,
 * this rule primarily validates the lock state consistency.
 */
export const validateImmutability: ValidationRule = (period) => {
  const isLocked = period.status === "locked";

  if (!isLocked) {
    return {
      ruleId: "UKRI-TS-008",
      ruleName: "Immutability verification",
      funderClause:
        "UKRI Terms and Conditions of Grant, Section: Record Keeping — approved time records must be retained unmodified as audit evidence",
      severity: "error",
      passed: true,
      message: "Period is not locked — immutability check not applicable.",
      details: {
        status: period.status,
        isLocked: false,
      },
    };
  }

  const hasLockTimestamp = period.lockedAt !== null;
  const hasRequiredSignatures =
    period.signedAt !== null && period.countersignedAt !== null;
  const hasSubmission = period.submittedAt !== null;

  const issues: string[] = [];

  if (!hasLockTimestamp) {
    issues.push("Period is marked as locked but has no lockedAt timestamp.");
  }

  if (!hasRequiredSignatures) {
    issues.push(
      "Period is locked but is missing required signatures — this should not be possible."
    );
  }

  if (!hasSubmission) {
    issues.push(
      "Period is locked but has no submission timestamp — state integrity violated."
    );
  }

  if (period.lockedAt && period.signedAt) {
    if (period.lockedAt < period.signedAt) {
      issues.push(
        "Period was locked before it was signed — state transition order violated."
      );
    }
  }

  if (period.lockedAt && period.countersignedAt) {
    if (period.lockedAt < period.countersignedAt) {
      issues.push(
        "Period was locked before it was countersigned — state transition order violated."
      );
    }
  }

  return {
    ruleId: "UKRI-TS-008",
    ruleName: "Immutability verification",
    funderClause:
      "UKRI Terms and Conditions of Grant, Section: Record Keeping — approved time records must be retained unmodified as audit evidence",
    severity: "error",
    passed: issues.length === 0,
    message:
      issues.length === 0
        ? "Locked period integrity verified — all timestamps and signatures are consistent."
        : `Locked period integrity issues: ${issues.join(" ")}`,
    details: {
      status: period.status,
      isLocked: true,
      hasLockTimestamp,
      hasRequiredSignatures,
      hasSubmission,
      lockedAt: period.lockedAt,
      signedAt: period.signedAt,
      countersignedAt: period.countersignedAt,
      submittedAt: period.submittedAt,
      issues,
    },
  };
};
