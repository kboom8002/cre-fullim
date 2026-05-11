/**
 * Unit Tests: Admin / Analytics (Slice 13)
 *
 * Tests for:
 *   - docs/09-cross-app-events.md §4-§6 Event types, §7 Metadata rules
 *   - docs/21-information-architecture.md (role-based routing)
 *   - docs/23-full-im-studio-dashboard.md §14 Next Best Action
 *
 * Rules:
 *   - admin/reviewer roles see privileged data; broker/editor do not (role-based access)
 *   - analytics events must NOT include protected raw data (docs/09 §7)
 *   - safety events are always visible to admin (docs/09 §6)
 *   - event counts computed from activity_events table
 *   - next_best_action derived from project state (docs/23 §14)
 *   - non-admin blocked from admin routes
 */
import { describe, it, expect } from "vitest";
import {
  checkAdminAccess,
  computeNextBestAction,
  buildAnalyticsSummary,
  filterSafeEventMetadata,
  ADMIN_ROLES,
  REVIEWER_ROLES,
  type AdminAccessInput,
  type ProjectStateInput,
  type AnalyticsEventInput,
} from "@/domain/admin/admin-service";

// ─── Fixtures ──────────────────────────────────────────────────────────

const ADMIN_USER: AdminAccessInput = { actor_role: "admin", resource: "admin_dashboard" };
const REVIEWER_USER: AdminAccessInput = { actor_role: "reviewer", resource: "gate_queue" };
const BROKER_USER: AdminAccessInput = { actor_role: "broker", resource: "admin_dashboard" };
const EDITOR_USER: AdminAccessInput = { actor_role: "im_editor", resource: "admin_dashboard" };

// ─── 1. checkAdminAccess ──────────────────────────────────────────────

describe("checkAdminAccess: role guards", () => {
  it("admin can access admin_dashboard", () => {
    expect(checkAdminAccess(ADMIN_USER).allowed).toBe(true);
  });

  it("reviewer can access gate_queue", () => {
    expect(checkAdminAccess(REVIEWER_USER).allowed).toBe(true);
  });

  it("reviewer CANNOT access admin_dashboard", () => {
    const result = checkAdminAccess({ actor_role: "reviewer", resource: "admin_dashboard" });
    expect(result.allowed).toBe(false);
  });

  it("broker is blocked from admin_dashboard", () => {
    expect(checkAdminAccess(BROKER_USER).allowed).toBe(false);
  });

  it("im_editor is blocked from admin_dashboard", () => {
    expect(checkAdminAccess(EDITOR_USER).allowed).toBe(false);
  });

  it("blocked access includes reason", () => {
    const result = checkAdminAccess(BROKER_USER);
    expect(result.reason).toBeTruthy();
  });

  it("ADMIN_ROLES contains admin", () => {
    expect(ADMIN_ROLES).toContain("admin");
  });

  it("REVIEWER_ROLES contains reviewer", () => {
    expect(REVIEWER_ROLES).toContain("reviewer");
  });

  it("admin can access golden_candidates", () => {
    const result = checkAdminAccess({ actor_role: "admin", resource: "golden_candidates" });
    expect(result.allowed).toBe(true);
  });

  it("reviewer can access golden_candidates for review", () => {
    const result = checkAdminAccess({ actor_role: "reviewer", resource: "golden_candidates" });
    expect(result.allowed).toBe(true);
  });

  it("broker CANNOT access golden_candidates", () => {
    const result = checkAdminAccess({ actor_role: "broker", resource: "golden_candidates" });
    expect(result.allowed).toBe(false);
  });
});

// ─── 2. computeNextBestAction ─────────────────────────────────────────

describe("computeNextBestAction: docs/23 §14", () => {
  it("no readiness → Run Readiness", () => {
    const state: ProjectStateInput = {
      status: "created", readiness_score: null, sections_count: 0,
      has_outline: false, has_ai_drafts: false, gate_status: "not_run",
      has_p0_violation: false, expert_patches_required: 0,
    };
    const action = computeNextBestAction(state);
    expect(action.action_key).toBe("run_readiness");
  });

  it("readiness done but no outline → Generate Outline", () => {
    const state: ProjectStateInput = {
      status: "readiness_checked", readiness_score: 72, sections_count: 0,
      has_outline: false, has_ai_drafts: false, gate_status: "not_run",
      has_p0_violation: false, expert_patches_required: 0,
    };
    const action = computeNextBestAction(state);
    expect(action.action_key).toBe("generate_outline");
  });

  it("outline exists but no drafts → Generate Drafts", () => {
    const state: ProjectStateInput = {
      status: "outline_generated", readiness_score: 72, sections_count: 18,
      has_outline: true, has_ai_drafts: false, gate_status: "not_run",
      has_p0_violation: false, expert_patches_required: 0,
    };
    const action = computeNextBestAction(state);
    expect(action.action_key).toBe("generate_drafts");
  });

  it("expert patches required → Request Expert Patch", () => {
    const state: ProjectStateInput = {
      status: "ai_draft", readiness_score: 72, sections_count: 18,
      has_outline: true, has_ai_drafts: true, gate_status: "not_run",
      has_p0_violation: false, expert_patches_required: 3,
    };
    const action = computeNextBestAction(state);
    expect(action.action_key).toBe("request_expert_patch");
  });

  it("drafts complete → Run Gate Review", () => {
    const state: ProjectStateInput = {
      status: "ai_draft", readiness_score: 80, sections_count: 18,
      has_outline: true, has_ai_drafts: true, gate_status: "not_run",
      has_p0_violation: false, expert_patches_required: 0,
    };
    const action = computeNextBestAction(state);
    expect(action.action_key).toBe("run_gate_review");
  });

  it("gate passed → Export", () => {
    const state: ProjectStateInput = {
      status: "buyer_ready", readiness_score: 90, sections_count: 18,
      has_outline: true, has_ai_drafts: true, gate_status: "pass",
      has_p0_violation: false, expert_patches_required: 0,
    };
    const action = computeNextBestAction(state);
    expect(action.action_key).toBe("export");
  });

  it("gate blocked → Fix Required Actions", () => {
    const state: ProjectStateInput = {
      status: "gate_review", readiness_score: 75, sections_count: 18,
      has_outline: true, has_ai_drafts: true, gate_status: "blocked",
      has_p0_violation: true, expert_patches_required: 0,
    };
    const action = computeNextBestAction(state);
    expect(action.action_key).toBe("fix_gate_issues");
  });

  it("next action has label and cta_url", () => {
    const state: ProjectStateInput = {
      status: "created", readiness_score: null, sections_count: 0,
      has_outline: false, has_ai_drafts: false, gate_status: "not_run",
      has_p0_violation: false, expert_patches_required: 0,
    };
    const action = computeNextBestAction(state);
    expect(action.label).toBeTruthy();
    expect(action.cta_url).toBeTruthy();
  });
});

// ─── 3. buildAnalyticsSummary ─────────────────────────────────────────

describe("buildAnalyticsSummary", () => {
  const EVENTS: AnalyticsEventInput[] = [
    { event_type: "im_project_created", occurred_at: "2026-05-01T00:00:00Z", source_app: "js-full-im-studio" },
    { event_type: "im_project_created", occurred_at: "2026-05-02T00:00:00Z", source_app: "js-full-im-studio" },
    { event_type: "gate_review_completed", occurred_at: "2026-05-03T00:00:00Z", source_app: "js-full-im-studio" },
    { event_type: "buyer_ready_approved", occurred_at: "2026-05-04T00:00:00Z", source_app: "js-full-im-studio" },
    { event_type: "disclosure_violation_blocked", occurred_at: "2026-05-05T00:00:00Z", source_app: "js-full-im-studio" },
    { event_type: "golden_candidate_created", occurred_at: "2026-05-06T00:00:00Z", source_app: "js-full-im-studio" },
  ];

  it("counts events by type", () => {
    const summary = buildAnalyticsSummary(EVENTS);
    expect(summary.event_counts["im_project_created"]).toBe(2);
  });

  it("includes safety_event_count", () => {
    const summary = buildAnalyticsSummary(EVENTS);
    expect(summary.safety_event_count).toBeGreaterThan(0);
  });

  it("disclosure_violation_blocked is counted as safety event", () => {
    const summary = buildAnalyticsSummary(EVENTS);
    expect(summary.safety_events).toContainEqual(
      expect.objectContaining({ event_type: "disclosure_violation_blocked" }),
    );
  });

  it("total_events matches input length", () => {
    const summary = buildAnalyticsSummary(EVENTS);
    expect(summary.total_events).toBe(EVENTS.length);
  });

  it("has funnel_metrics with key stages", () => {
    const summary = buildAnalyticsSummary(EVENTS);
    expect(summary.funnel_metrics).toHaveProperty("projects_created");
    expect(summary.funnel_metrics).toHaveProperty("buyer_ready_count");
  });
});

// ─── 4. filterSafeEventMetadata ───────────────────────────────────────

describe("filterSafeEventMetadata: docs/09 §7", () => {
  it("removes forbidden field: exact_address", () => {
    const meta = { project_id: "p1", exact_address: "서울 성동구 123-45", status: "draft" };
    const safe = filterSafeEventMetadata(meta);
    expect(safe).not.toHaveProperty("exact_address");
  });

  it("removes forbidden field: tenant_name", () => {
    const meta = { project_id: "p1", tenant_name: "스타벅스", readiness_score: 72 };
    const safe = filterSafeEventMetadata(meta);
    expect(safe).not.toHaveProperty("tenant_name");
  });

  it("removes forbidden field: unit_rent", () => {
    const meta = { project_id: "p1", unit_rent: "월세 300만원", gate_type: "disclosure" };
    const safe = filterSafeEventMetadata(meta);
    expect(safe).not.toHaveProperty("unit_rent");
  });

  it("removes forbidden field: seller_motivation", () => {
    const meta = { project_id: "p1", seller_motivation: "개인 사정", export_type: "pdf" };
    const safe = filterSafeEventMetadata(meta);
    expect(safe).not.toHaveProperty("seller_motivation");
  });

  it("keeps allowed fields: project_id, status, readiness_score", () => {
    const meta = { project_id: "p1", status: "draft", readiness_score: 72 };
    const safe = filterSafeEventMetadata(meta);
    expect(safe).toHaveProperty("project_id");
    expect(safe).toHaveProperty("status");
    expect(safe).toHaveProperty("readiness_score");
  });
});
