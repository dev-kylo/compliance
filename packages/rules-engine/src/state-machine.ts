import type { TimesheetStatus } from "@compliance/shared-types";

/**
 * Timesheet period status state machine.
 *
 * Valid transitions:
 *   draft → submitted → signed → countersigned → locked
 *
 * No backwards transitions. No skipping states.
 */
export const STATUS_TRANSITIONS: Record<TimesheetStatus, TimesheetStatus | null> = {
  draft: "submitted",
  submitted: "signed",
  signed: "countersigned",
  countersigned: "locked",
  locked: null,
};

export function validateStatusTransition(
  currentStatus: TimesheetStatus,
  newStatus: TimesheetStatus
): { valid: boolean; message: string } {
  const allowedNext = STATUS_TRANSITIONS[currentStatus];

  if (allowedNext === null) {
    return {
      valid: false,
      message: `Cannot transition from '${currentStatus}' — this is a terminal state. Locked timesheets cannot be modified.`,
    };
  }

  if (newStatus !== allowedNext) {
    return {
      valid: false,
      message: `Invalid transition from '${currentStatus}' to '${newStatus}'. The only allowed transition is '${currentStatus}' → '${allowedNext}'.`,
    };
  }

  return {
    valid: true,
    message: `Valid transition: '${currentStatus}' → '${newStatus}'.`,
  };
}

export function getNextStatus(
  currentStatus: TimesheetStatus
): TimesheetStatus | null {
  return STATUS_TRANSITIONS[currentStatus];
}

export function canTransitionTo(
  currentStatus: TimesheetStatus,
  targetStatus: TimesheetStatus
): boolean {
  return STATUS_TRANSITIONS[currentStatus] === targetStatus;
}
