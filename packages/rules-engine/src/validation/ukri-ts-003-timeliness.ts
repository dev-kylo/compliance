import type { ValidationRule } from "@compliance/shared-types";
import { getFunderProfile } from "../funder-profiles";

/**
 * UKRI-TS-003: Timeliness of submission
 *
 * submittedAt should be within funderProfile.submissionDeadlineDays of the period end.
 * Warning if late, Error if more than 30 days late.
 * Contemporaneous completion is a UKRI requirement.
 */
export const validateTimeliness: ValidationRule = (
  period,
  _researcher,
  grants
) => {
  if (!period.submittedAt) {
    return {
      ruleId: "UKRI-TS-003",
      ruleName: "Timeliness of submission",
      funderClause:
        "UKRI Terms and Conditions of Grant, Section: Expenditure — time records must be completed contemporaneously",
      severity: "error",
      passed: false,
      message: "Timesheet has not been submitted.",
      details: {
        submittedAt: null,
        periodEnd: null,
        daysLate: null,
      },
    };
  }

  // Determine funder deadline from the first grant's profile, defaulting to UKRI's 10 days
  const funderProfileId =
    grants.length > 0 ? grants[0].funderProfileId : "ukri";
  const funderProfile = getFunderProfile(funderProfileId);
  const deadlineDays = funderProfile?.submissionDeadlineDays ?? 10;

  const periodEnd = new Date(period.year, period.month, 0);
  const deadline = new Date(periodEnd);
  deadline.setDate(deadline.getDate() + deadlineDays);

  const submittedAt = new Date(period.submittedAt);
  const daysLate = Math.max(
    0,
    Math.floor(
      (submittedAt.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const isOnTime = daysLate === 0;
  const isVeryLate = daysLate > 30;

  let severity: "error" | "warning" | "info";
  let message: string;

  if (isOnTime) {
    severity = "info";
    message = "Timesheet was submitted on time.";
  } else if (isVeryLate) {
    severity = "error";
    message = `Timesheet was submitted ${daysLate} days after the deadline (more than 30 days late). This raises serious concerns about contemporaneous completion.`;
  } else {
    severity = "warning";
    message = `Timesheet was submitted ${daysLate} day(s) after the deadline. Consider submitting within ${deadlineDays} days of period end.`;
  }

  return {
    ruleId: "UKRI-TS-003",
    ruleName: "Timeliness of submission",
    funderClause:
      "UKRI Terms and Conditions of Grant, Section: Expenditure — time records must be completed contemporaneously",
    severity,
    passed: isOnTime,
    message,
    details: {
      submittedAt: period.submittedAt,
      periodEnd: periodEnd.toISOString(),
      deadlineDays,
      deadline: deadline.toISOString(),
      daysLate,
    },
  };
};
