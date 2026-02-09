/// <reference types="vitest/globals" />

import type { TimesheetStatus } from "@compliance/shared-types";
import {
  validateStatusTransition,
  getNextStatus,
  canTransitionTo,
} from "../src/state-machine";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("state-machine", () => {
  describe("validateStatusTransition — valid transitions", () => {
    const validTransitions: [TimesheetStatus, TimesheetStatus][] = [
      ["draft", "submitted"],
      ["submitted", "signed"],
      ["signed", "countersigned"],
      ["countersigned", "locked"],
    ];

    it.each(validTransitions)(
      "%s → %s is a valid transition",
      (from, to) => {
        const result = validateStatusTransition(from, to);
        expect(result.valid).toBe(true);
        expect(result.message).toContain("Valid transition");
      }
    );
  });

  describe("validateStatusTransition — cannot skip states", () => {
    it("draft → signed is invalid (skips submitted)", () => {
      const result = validateStatusTransition("draft", "signed");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("Invalid transition");
    });

    it("draft → countersigned is invalid", () => {
      const result = validateStatusTransition("draft", "countersigned");
      expect(result.valid).toBe(false);
    });

    it("draft → locked is invalid", () => {
      const result = validateStatusTransition("draft", "locked");
      expect(result.valid).toBe(false);
    });

    it("submitted → countersigned is invalid (skips signed)", () => {
      const result = validateStatusTransition("submitted", "countersigned");
      expect(result.valid).toBe(false);
    });

    it("submitted → locked is invalid", () => {
      const result = validateStatusTransition("submitted", "locked");
      expect(result.valid).toBe(false);
    });

    it("signed → locked is invalid (skips countersigned)", () => {
      const result = validateStatusTransition("signed", "locked");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateStatusTransition — cannot go backwards", () => {
    it("signed → draft is invalid", () => {
      const result = validateStatusTransition("signed", "draft");
      expect(result.valid).toBe(false);
    });

    it("submitted → draft is invalid", () => {
      const result = validateStatusTransition("submitted", "draft");
      expect(result.valid).toBe(false);
    });

    it("countersigned → signed is invalid", () => {
      const result = validateStatusTransition("countersigned", "signed");
      expect(result.valid).toBe(false);
    });

    it("locked → countersigned is invalid", () => {
      const result = validateStatusTransition("locked", "countersigned");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateStatusTransition — locked is terminal", () => {
    const allStatuses: TimesheetStatus[] = [
      "draft",
      "submitted",
      "signed",
      "countersigned",
      "locked",
    ];

    it.each(allStatuses)(
      "locked → %s is invalid (locked is terminal)",
      (target) => {
        const result = validateStatusTransition("locked", target);
        expect(result.valid).toBe(false);
        expect(result.message).toContain("terminal state");
      }
    );
  });

  describe("getNextStatus", () => {
    it("returns submitted for draft", () => {
      expect(getNextStatus("draft")).toBe("submitted");
    });

    it("returns signed for submitted", () => {
      expect(getNextStatus("submitted")).toBe("signed");
    });

    it("returns countersigned for signed", () => {
      expect(getNextStatus("signed")).toBe("countersigned");
    });

    it("returns locked for countersigned", () => {
      expect(getNextStatus("countersigned")).toBe("locked");
    });

    it("returns null for locked (no next state)", () => {
      expect(getNextStatus("locked")).toBeNull();
    });
  });

  describe("canTransitionTo", () => {
    it("returns true for valid forward transitions", () => {
      expect(canTransitionTo("draft", "submitted")).toBe(true);
      expect(canTransitionTo("submitted", "signed")).toBe(true);
      expect(canTransitionTo("signed", "countersigned")).toBe(true);
      expect(canTransitionTo("countersigned", "locked")).toBe(true);
    });

    it("returns false for skipped transitions", () => {
      expect(canTransitionTo("draft", "signed")).toBe(false);
      expect(canTransitionTo("draft", "locked")).toBe(false);
      expect(canTransitionTo("submitted", "locked")).toBe(false);
    });

    it("returns false for backward transitions", () => {
      expect(canTransitionTo("signed", "draft")).toBe(false);
      expect(canTransitionTo("locked", "draft")).toBe(false);
      expect(canTransitionTo("countersigned", "submitted")).toBe(false);
    });

    it("returns false for same-state transitions", () => {
      expect(canTransitionTo("draft", "draft")).toBe(false);
      expect(canTransitionTo("locked", "locked")).toBe(false);
    });

    it("returns false for any transition from locked", () => {
      expect(canTransitionTo("locked", "draft")).toBe(false);
      expect(canTransitionTo("locked", "submitted")).toBe(false);
      expect(canTransitionTo("locked", "signed")).toBe(false);
      expect(canTransitionTo("locked", "countersigned")).toBe(false);
      expect(canTransitionTo("locked", "locked")).toBe(false);
    });
  });
});
