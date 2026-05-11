/**
 * Admin Service (Slice 13)
 *
 * Implements:
 *   - docs/09-cross-app-events.md §6 Safety Events, §7 Metadata Rules
 *   - docs/21-information-architecture.md Role-based routing
 *   - docs/23-full-im-studio-dashboard.md §14 Next Best Action
 *
 * Rules:
 *   - admin: full access to admin_dashboard, analytics, golden_candidates (docs/03)
 *   - reviewer: gate_queue, golden_candidates review — NOT admin_dashboard
 *   - broker/im_editor: project-level access only — blocked from admin
 *   - Event metadata must never include forbidden fields (docs/09 §7)
 *   - Safety events are always surfaced to admin (docs/09 §6)
 *   - Next best action derived from project state (docs/23 §14)
 */

// ─── Role constants ────────────────────────────────────────────────────

export const ADMIN_ROLES = ["admin"] as const;
export const REVIEWER_ROLES = ["reviewer", "admin"] as const;
export const INTERNAL_ROLES = ["admin", "reviewer", "im_editor"] as const;

// Resource → minimum role required
const RESOURCE_ROLE_MAP: Record<string, readonly string[]> = {
  admin_dashboard:   ADMIN_ROLES,
  admin_projects:    ADMIN_ROLES,
  admin_experts:     ADMIN_ROLES,
  admin_analytics:   ADMIN_ROLES,
  golden_candidates: REVIEWER_ROLES,
  gate_queue:        REVIEWER_ROLES,
  gate_review:       REVIEWER_ROLES,
};

// ─── Types ─────────────────────────────────────────────────────────────

export interface AdminAccessInput {
  actor_role: string;
  resource: string;
}

export interface AdminAccessResult {
  allowed: boolean;
  reason?: string;
}

export type NextBestActionKey =
  | "run_readiness"
  | "generate_outline"
  | "generate_drafts"
  | "request_expert_patch"
  | "run_gate_review"
  | "fix_gate_issues"
  | "approve_buyer_ready"
  | "export";

export interface ProjectStateInput {
  status: string;
  readiness_score: number | null;
  sections_count: number;
  has_outline: boolean;
  has_ai_drafts: boolean;
  gate_status: string;
  has_p0_violation: boolean;
  expert_patches_required: number;
  project_id?: string;
}

export interface NextBestAction {
  action_key: NextBestActionKey;
  label: string;
  description: string;
  cta_url: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface AnalyticsEventInput {
  event_type: string;
  occurred_at: string;
  source_app: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsSummary {
  total_events: number;
  event_counts: Record<string, number>;
  safety_event_count: number;
  safety_events: AnalyticsEventInput[];
  funnel_metrics: {
    projects_created: number;
    outlines_generated: number;
    expert_patches_submitted: number;
    gate_reviews_completed: number;
    buyer_ready_count: number;
    exports_completed: number;
  };
}

// ─── Safety event types (docs/09 §6) ─────────────────────────────────

const SAFETY_EVENT_TYPES = new Set([
  "disclosure_redaction_applied",
  "disclosure_violation_blocked",
  "forbidden_claim_blocked",
  "ai_schema_validation_failed",
  "financial_consistency_issue_detected",
  "export_blocked_by_gate",
  "buyer_ready_blocked",
]);

// ─── Forbidden metadata fields (docs/09 §7) ───────────────────────────

const FORBIDDEN_METADATA_FIELDS = new Set([
  "exact_address",
  "tenant_name",
  "unit_rent",
  "owner_contact",
  "buyer_contact",
  "seller_motivation",
  "negotiation_memo",
  "full_lease_text",
  "raw_evidence_content",
  "broker_note",
  "personal_info",
]);

// ─── checkAdminAccess ─────────────────────────────────────────────────

/**
 * Role-based resource access check.
 * Unlisted resources default to internal_roles only.
 */
export function checkAdminAccess(input: AdminAccessInput): AdminAccessResult {
  const allowedRoles = RESOURCE_ROLE_MAP[input.resource] ?? INTERNAL_ROLES;

  if ((allowedRoles as readonly string[]).includes(input.actor_role)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `역할 '${input.actor_role}'은(는) '${input.resource}' 리소스에 접근할 수 없습니다. 필요 역할: ${[...allowedRoles].join(", ")}`,
  };
}

// ─── computeNextBestAction ────────────────────────────────────────────

const NBA_ACTIONS: Record<NextBestActionKey, Omit<NextBestAction, "action_key" | "cta_url">> = {
  run_readiness:       { label: "Readiness 검토 실행",       description: "프로젝트 데이터 준비도를 분석합니다.",         priority: "critical" },
  generate_outline:    { label: "섹션 아웃라인 생성",         description: "18개 섹션 구조를 생성합니다.",               priority: "high" },
  generate_drafts:     { label: "AI 초안 생성",              description: "핵심 섹션 AI 초안을 작성합니다.",             priority: "high" },
  request_expert_patch:{ label: "전문가 검토 요청",           description: "전문가 패치가 필요한 섹션을 배정합니다.",      priority: "high" },
  run_gate_review:     { label: "Gate 검토 실행",             description: "Buyer-ready 출력을 위한 게이트를 검사합니다.", priority: "high" },
  fix_gate_issues:     { label: "Gate 이슈 수정",             description: "차단된 Gate 이슈를 해결해야 합니다.",         priority: "critical" },
  approve_buyer_ready: { label: "Buyer-ready 승인",          description: "Reviewer가 최종 승인합니다.",                priority: "medium" },
  export:              { label: "내보내기",                   description: "IM을 PDF/Markdown/Web으로 내보냅니다.",       priority: "medium" },
};

/**
 * Computes next best action from current project state.
 * Priority order mirrors docs/23 §14.
 */
export function computeNextBestAction(state: ProjectStateInput): NextBestAction {
  const pid = state.project_id ?? "[id]";

  const makeAction = (key: NextBestActionKey, url: string): NextBestAction => ({
    action_key: key,
    cta_url: url,
    ...NBA_ACTIONS[key],
  });

  // P0: gate blocked
  if (state.gate_status === "blocked" || state.has_p0_violation) {
    return makeAction("fix_gate_issues", `/im-projects/${pid}/gate-review`);
  }

  // Gate passed → export
  if (state.gate_status === "pass" || state.status === "buyer_ready") {
    return makeAction("export", `/im-projects/${pid}/export`);
  }

  // No readiness yet
  if (state.readiness_score === null || state.readiness_score === undefined) {
    return makeAction("run_readiness", `/api/im-projects/${pid}/readiness-check`);
  }

  // No outline
  if (!state.has_outline || state.sections_count === 0) {
    return makeAction("generate_outline", `/api/im-projects/${pid}/generate-outline`);
  }

  // No AI drafts
  if (!state.has_ai_drafts) {
    return makeAction("generate_drafts", `/im-projects/${pid}/sections`);
  }

  // Expert patches needed
  if (state.expert_patches_required > 0) {
    return makeAction("request_expert_patch", `/expert/assignments`);
  }

  // All drafts done → run gate review
  return makeAction("run_gate_review", `/im-projects/${pid}/gate-review`);
}

// ─── buildAnalyticsSummary ────────────────────────────────────────────

/**
 * Aggregates activity events into analytics summary.
 * Safety events are separated for admin visibility (docs/09 §6).
 */
export function buildAnalyticsSummary(events: AnalyticsEventInput[]): AnalyticsSummary {
  const event_counts: Record<string, number> = {};
  const safety_events: AnalyticsEventInput[] = [];

  for (const ev of events) {
    event_counts[ev.event_type] = (event_counts[ev.event_type] ?? 0) + 1;
    if (SAFETY_EVENT_TYPES.has(ev.event_type)) {
      safety_events.push(ev);
    }
  }

  const funnel_metrics = {
    projects_created:           event_counts["im_project_created"] ?? 0,
    outlines_generated:         event_counts["im_outline_generated"] ?? 0,
    expert_patches_submitted:   event_counts["expert_patch_submitted"] ?? 0,
    gate_reviews_completed:     event_counts["gate_review_completed"] ?? 0,
    buyer_ready_count:          event_counts["buyer_ready_approved"] ?? 0,
    exports_completed:          event_counts["im_exported"] ?? 0,
  };

  return {
    total_events: events.length,
    event_counts,
    safety_event_count: safety_events.length,
    safety_events,
    funnel_metrics,
  };
}

// ─── filterSafeEventMetadata ──────────────────────────────────────────

/**
 * Strips forbidden fields from event metadata before logging/display.
 * docs/09 §7.
 */
export function filterSafeEventMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!FORBIDDEN_METADATA_FIELDS.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
}
