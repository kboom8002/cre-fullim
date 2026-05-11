/**
 * Section Status Transition Service (Slice 7)
 *
 * Implements docs/13-status-transition.md §4 IM Section Status Machine.
 *
 * Rules:
 *   - Transitions follow the defined state machine only
 *   - ai_draft → buyer_ready is INVALID (requires gate_review first)
 *   - needs_expert_patch → buyer_ready is INVALID
 *   - buyer_ready and blocked are terminal states
 *   - Invalid transitions throw SectionTransitionError with structured code
 *   - Status changes must NOT be performed directly in UI (docs/13 §10)
 */

// ─── Types ────────────────────────────────────────────────────────────

export type SectionStatus =
  | "not_started"
  | "planned"
  | "ai_draft"
  | "needs_data"
  | "needs_expert_patch"
  | "patched"
  | "gate_review"
  | "buyer_ready"
  | "blocked";

export interface SectionTransitionError extends Error {
  code: "INVALID_TRANSITION";
  from_status: SectionStatus;
  to_status: SectionStatus;
  message: string;
}

export interface SectionTransitionResult {
  status: SectionStatus;
  from_status: SectionStatus;
  to_status: SectionStatus;
  actor_role: string;
  reason?: string;
  event_type: string;
}

export interface SectionTransitionInput {
  from: SectionStatus;
  to: SectionStatus;
  actor_role: string;
  reason?: string;
}

// ─── State Machine (docs/13 §4 + §8 Section Status Actions) ──────────

/**
 * Maps each status to its valid target statuses.
 * buyer_ready and blocked are terminal (empty arrays).
 *
 * Critical guard (docs/13 §12):
 *   ai_draft → buyer_ready: INVALID (must pass gate_review first)
 *   needs_expert_patch → buyer_ready: INVALID (must patch first)
 */
export const SECTION_STATUS_MACHINE: Record<SectionStatus, SectionStatus[]> = {
  not_started: ["planned"],
  planned: ["ai_draft", "needs_data", "needs_expert_patch", "blocked"],
  ai_draft: ["needs_data", "needs_expert_patch", "gate_review", "blocked"],
  // NOTE: ai_draft → buyer_ready intentionally OMITTED (docs/13 §13)
  needs_data: ["planned", "ai_draft", "blocked"],
  needs_expert_patch: ["patched", "blocked"],
  // NOTE: needs_expert_patch → buyer_ready intentionally OMITTED (docs/13 §13)
  patched: ["gate_review", "needs_expert_patch", "blocked"],
  gate_review: ["buyer_ready", "needs_data", "needs_expert_patch", "blocked"],
  buyer_ready: [], // terminal — no further transitions
  blocked: [],    // terminal blocking state
};

// ─── isValidSectionTransition ─────────────────────────────────────────

export function isValidSectionTransition(
  from: SectionStatus,
  to: SectionStatus,
): boolean {
  const allowed = SECTION_STATUS_MACHINE[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

// ─── transitionSectionStatus ─────────────────────────────────────────

export function transitionSectionStatus(
  input: SectionTransitionInput,
): SectionTransitionResult {
  const { from, to, actor_role, reason } = input;

  if (!isValidSectionTransition(from, to)) {
    const err = new Error(
      `Invalid section status transition: ${from} → ${to}. ` +
      (to === "buyer_ready"
        ? "Buyer-ready requires gate_review → buyer_ready path. AI draft cannot skip gate review."
        : "This transition is not permitted by the section status machine."),
    ) as SectionTransitionError;
    err.code = "INVALID_TRANSITION";
    err.from_status = from;
    err.to_status = to;
    throw err;
  }

  return {
    status: to,
    from_status: from,
    to_status: to,
    actor_role,
    reason,
    event_type: "im_section_status_changed",
  };
}

// ─── Project State Machine ──────────────────────────────────────────

export type ProjectStatus =
  | "intake"
  | "ssot_building"
  | "readiness_checked"
  | "outline_generated"
  | "ai_draft"
  | "expert_patch"
  | "gate_review"
  | "client_review"
  | "buyer_ready"
  | "exported"
  | "dealroom_published"
  | "archived"
  | "blocked";

export const PROJECT_STATUS_MACHINE: Record<ProjectStatus, ProjectStatus[]> = {
  intake: ["ssot_building", "blocked", "archived"],
  ssot_building: ["readiness_checked", "blocked", "archived"],
  readiness_checked: ["outline_generated", "blocked", "archived"],
  outline_generated: ["ai_draft", "blocked", "archived"],
  ai_draft: ["expert_patch", "gate_review", "blocked", "archived"],
  expert_patch: ["gate_review", "blocked", "archived"],
  gate_review: ["client_review", "buyer_ready", "blocked", "archived"],
  client_review: ["buyer_ready", "blocked", "archived"],
  buyer_ready: ["exported", "blocked", "archived"],
  exported: ["dealroom_published", "blocked", "archived"],
  dealroom_published: ["archived", "blocked"],
  archived: [],
  blocked: ["archived"],
};

export interface ProjectTransitionError extends Error {
  code: "INVALID_TRANSITION";
  from_status: ProjectStatus;
  to_status: ProjectStatus;
  message: string;
}

export interface ProjectTransitionResult {
  status: ProjectStatus;
  from_status: ProjectStatus;
  to_status: ProjectStatus;
  actor_role: string;
  reason?: string;
  event_type: string;
}

export interface ProjectTransitionInput {
  from: ProjectStatus;
  to: ProjectStatus;
  actor_role: string;
  reason?: string;
}

export function isValidProjectTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): boolean {
  const allowed = PROJECT_STATUS_MACHINE[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function transitionProjectStatus(
  input: ProjectTransitionInput,
): ProjectTransitionResult {
  const { from, to, actor_role, reason } = input;

  if (!isValidProjectTransition(from, to)) {
    const err = new Error(
      `Invalid project status transition: ${from} → ${to}.`
    ) as ProjectTransitionError;
    err.code = "INVALID_TRANSITION";
    err.from_status = from;
    err.to_status = to;
    throw err;
  }

  return {
    status: to,
    from_status: from,
    to_status: to,
    actor_role,
    reason,
    event_type: "im_project_status_changed",
  };
}
