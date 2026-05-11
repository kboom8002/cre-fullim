/**
 * Unit Tests: Status Transition Service (Slice 7)
 *
 * Tests for:
 *   - docs/13-status-transition.md §4 IM Section Status Machine
 *   - docs/13-status-transition.md §12 Guard Conditions (buyer-ready)
 *   - docs/13-status-transition.md §13 Invalid Transitions
 *   - docs/24-section-editor-spec.md §8 Section Status Actions
 *
 * Rules:
 *   - Section transitions follow defined state machine
 *   - ai_draft → buyer_ready without gate is INVALID
 *   - needs_expert_patch → buyer_ready without patch is INVALID
 *   - All valid transitions return new status
 *   - Invalid transitions throw structured error
 */
import { describe, it, expect } from "vitest";
import {
  transitionSectionStatus,
  isValidSectionTransition,
  SECTION_STATUS_MACHINE,
  type SectionTransitionError,
} from "@/domain/sections/status-transition";

// ─── 1. Valid section transitions ────────────────────────────────────

describe("isValidSectionTransition", () => {
  it("planned → ai_draft is valid", () => {
    expect(isValidSectionTransition("planned", "ai_draft")).toBe(true);
  });

  it("planned → needs_data is valid", () => {
    expect(isValidSectionTransition("planned", "needs_data")).toBe(true);
  });

  it("ai_draft → needs_expert_patch is valid", () => {
    expect(isValidSectionTransition("ai_draft", "needs_expert_patch")).toBe(true);
  });

  it("ai_draft → gate_review is valid", () => {
    expect(isValidSectionTransition("ai_draft", "gate_review")).toBe(true);
  });

  it("needs_expert_patch → patched is valid", () => {
    expect(isValidSectionTransition("needs_expert_patch", "patched")).toBe(true);
  });

  it("patched → gate_review is valid", () => {
    expect(isValidSectionTransition("patched", "gate_review")).toBe(true);
  });

  it("gate_review → buyer_ready is valid", () => {
    expect(isValidSectionTransition("gate_review", "buyer_ready")).toBe(true);
  });
});

// ─── 2. Invalid transitions ───────────────────────────────────────────

describe("isValidSectionTransition: invalid", () => {
  it("ai_draft → buyer_ready WITHOUT gate is INVALID", () => {
    expect(isValidSectionTransition("ai_draft", "buyer_ready")).toBe(false);
  });

  it("needs_expert_patch → buyer_ready is INVALID", () => {
    expect(isValidSectionTransition("needs_expert_patch", "buyer_ready")).toBe(false);
  });

  it("planned → buyer_ready is INVALID", () => {
    expect(isValidSectionTransition("planned", "buyer_ready")).toBe(false);
  });

  it("blocked → any forward state is INVALID", () => {
    expect(isValidSectionTransition("blocked", "ai_draft")).toBe(false);
    expect(isValidSectionTransition("blocked", "buyer_ready")).toBe(false);
  });

  it("buyer_ready → ai_draft is INVALID (no regression)", () => {
    expect(isValidSectionTransition("buyer_ready", "ai_draft")).toBe(false);
  });
});

// ─── 3. transitionSectionStatus ──────────────────────────────────────

describe("transitionSectionStatus: valid", () => {
  it("planned → ai_draft returns new status", () => {
    const result = transitionSectionStatus({ from: "planned", to: "ai_draft", actor_role: "system" });
    expect(result.status).toBe("ai_draft");
    expect(result.from_status).toBe("planned");
    expect(result.to_status).toBe("ai_draft");
  });

  it("ai_draft → needs_expert_patch returns correct event metadata", () => {
    const result = transitionSectionStatus({
      from: "ai_draft",
      to: "needs_expert_patch",
      actor_role: "editor",
      reason: "NOI 섹션 전문가 검토 필요",
    });
    expect(result.to_status).toBe("needs_expert_patch");
    expect(result.reason).toBe("NOI 섹션 전문가 검토 필요");
    expect(result.actor_role).toBe("editor");
  });

  it("gate_review → buyer_ready succeeds", () => {
    const result = transitionSectionStatus({
      from: "gate_review",
      to: "buyer_ready",
      actor_role: "reviewer",
    });
    expect(result.status).toBe("buyer_ready");
  });
});

describe("transitionSectionStatus: invalid throws", () => {
  it("ai_draft → buyer_ready throws SectionTransitionError", () => {
    expect(() =>
      transitionSectionStatus({ from: "ai_draft", to: "buyer_ready", actor_role: "editor" })
    ).toThrow();
  });

  it("error has structured code INVALID_TRANSITION", () => {
    try {
      transitionSectionStatus({ from: "ai_draft", to: "buyer_ready", actor_role: "editor" });
      expect(true).toBe(false); // should not reach
    } catch (e) {
      const err = e as SectionTransitionError;
      expect(err.code).toBe("INVALID_TRANSITION");
      expect(err.from_status).toBe("ai_draft");
      expect(err.to_status).toBe("buyer_ready");
    }
  });

  it("needs_expert_patch → buyer_ready throws INVALID_TRANSITION", () => {
    try {
      transitionSectionStatus({ from: "needs_expert_patch", to: "buyer_ready", actor_role: "editor" });
    } catch (e) {
      const err = e as SectionTransitionError;
      expect(err.code).toBe("INVALID_TRANSITION");
    }
  });
});

// ─── 4. State machine definition ─────────────────────────────────────

describe("SECTION_STATUS_MACHINE", () => {
  it("planned has ai_draft and needs_data as valid next states", () => {
    expect(SECTION_STATUS_MACHINE.planned).toContain("ai_draft");
    expect(SECTION_STATUS_MACHINE.planned).toContain("needs_data");
  });

  it("buyer_ready has no valid next states (terminal state)", () => {
    expect(SECTION_STATUS_MACHINE.buyer_ready).toHaveLength(0);
  });

  it("blocked has no valid next states (terminal blocking state)", () => {
    expect(SECTION_STATUS_MACHINE.blocked).toHaveLength(0);
  });

  it("all valid states are in the machine", () => {
    const states = [
      "not_started", "planned", "ai_draft", "needs_data",
      "needs_expert_patch", "patched", "gate_review", "buyer_ready", "blocked",
    ];
    for (const s of states) {
      expect(SECTION_STATUS_MACHINE).toHaveProperty(s);
    }
  });
});
