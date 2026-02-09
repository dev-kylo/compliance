/**
 * Database-level status transition validation for TimesheetPeriod.
 *
 * Status follows a strict state machine:
 *   DRAFT → SUBMITTED → SIGNED → COUNTERSIGNED → LOCKED
 *
 * No backwards transitions. No skipping states.
 */

type DbTimesheetStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "SIGNED"
  | "COUNTERSIGNED"
  | "LOCKED";

const STATUS_ORDER: DbTimesheetStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "SIGNED",
  "COUNTERSIGNED",
  "LOCKED",
];

const VALID_TRANSITIONS: Record<DbTimesheetStatus, DbTimesheetStatus | null> = {
  DRAFT: "SUBMITTED",
  SUBMITTED: "SIGNED",
  SIGNED: "COUNTERSIGNED",
  COUNTERSIGNED: "LOCKED",
  LOCKED: null,
};

export function validateStatusTransition(
  currentStatus: DbTimesheetStatus,
  newStatus: DbTimesheetStatus
): { valid: boolean; message: string } {
  const allowedNext = VALID_TRANSITIONS[currentStatus];

  if (allowedNext === null) {
    return {
      valid: false,
      message: `Cannot transition from '${currentStatus}' — this is a terminal state. Locked timesheets cannot be modified.`,
    };
  }

  if (newStatus !== allowedNext) {
    return {
      valid: false,
      message: `Invalid transition from '${currentStatus}' to '${newStatus}'. The only allowed next status is '${allowedNext}'.`,
    };
  }

  return {
    valid: true,
    message: `Valid transition: '${currentStatus}' → '${newStatus}'.`,
  };
}

/**
 * Transition a timesheet period to the next status, with validation.
 * Returns the data needed to update the period, including timestamp fields.
 */
export function transitionStatus(
  currentStatus: DbTimesheetStatus,
  newStatus: DbTimesheetStatus
): {
  valid: boolean;
  message: string;
  updateData?: Record<string, unknown>;
} {
  const validation = validateStatusTransition(currentStatus, newStatus);

  if (!validation.valid) {
    return validation;
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: newStatus,
  };

  switch (newStatus) {
    case "SUBMITTED":
      updateData.submittedAt = now;
      break;
    case "SIGNED":
      updateData.signedAt = now;
      break;
    case "COUNTERSIGNED":
      updateData.countersignedAt = now;
      break;
    case "LOCKED":
      updateData.lockedAt = now;
      break;
  }

  return {
    ...validation,
    updateData,
  };
}

export { STATUS_ORDER, VALID_TRANSITIONS };
export type { DbTimesheetStatus };
