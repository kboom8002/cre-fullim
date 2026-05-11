/**
 * Integration / Regression Tests: Slice 14 QA / Commercial Polish
 *
 * Tests for:
 *   - docs/28-test-plan.md §10 E2E happy-path flows (unit-level simulation)
 *   - docs/33-demo-scenarios.md A-J Demo scenarios
 *   - docs/34-commercial-readiness-checklist.md §4 AI Safety, §5 Disclosure, §8 Export
 *
 * Rules covered:
 *   - Handoff → Import → Readiness → Outline → Draft → Patch → Gate → Export happy path
 *   - Gate blocks unsafe output (P0 disclosure) (Demo G)
 *   - Expert patch happy path with edit_tags (Demo F)
 *   - Export includes disclaimer in ALL modes (docs/34 §8)
 *   - Draft export includes DRAFT label (docs/34 §8)
 *   - Buyer-ready export blocked before gate pass (docs/28 §8.7)
 *   - Commercial readiness score >= 16/20 (docs/34 §13)
 */
import { describe, it, expect } from "vitest";

// Domain services (using correct export names)
import { validateHandoffToken, createSafePreview } from "@/domain/handoff/handoff-service";
import { computeReadiness } from "@/domain/readiness/readiness-service";
import { planSections } from "@/domain/sections/section-planner";
import { runRiskBoundaryCheck, runDisclosureGuard } from "@/domain/ai/draft-guardrails";
import { ExpertPatchSubmitSchema } from "@/domain/expert/expert-patch";
import { runGateCheck, canApproveBuyerReady } from "@/domain/gate/gate-review-service";
import {
  checkExportEligibility,
  buildMarkdownExport,
  STANDARD_DISCLAIMER,
  DRAFT_LABEL,
} from "@/domain/export/export-service";
import {
  createGoldenCandidate,
  redactCandidate,
  approveCandidate,
} from "@/domain/golden/golden-dataset-service";
import { computeNextBestAction } from "@/domain/admin/admin-service";
import {
  computePilotReadinessScore,
  makeEmptyState,
  makeErrorState,
  makeLoadingState,
  type CommercialReadinessInput,
} from "@/domain/qa/commercial-readiness-service";

// Minimal payload stub for createSafePreview(payload, sourceData)
const STUB_PAYLOAD = {
  handoff_id: "hof_001",
  contracts_version: "1.0",
  payload_version: "1.0",
  source_building_ssot_lite_id: "bsl_001",
  requested_output: "buyer_ready_full_im" as const,
  package_intent: "ai_expert_review" as const,
  expires_at: new Date(Date.now() + 86400000).toISOString(),
  source_document_ids: [] as string[],
  area_signal: "성동구 성수권역",
  gross_area_sqm: 1200,
  building_type: "mixed_use",
};

// ─── Demo A: Handoff Token Validation ─────────────────────────────────

describe("Demo A: handoff token validation", () => {
  it("valid token string passes", () => {
    const result = validateHandoffToken("tok_abc123");
    expect(result.valid).toBe(true);
  });

  it("empty string fails", () => {
    const result = validateHandoffToken("");
    expect(result.valid).toBe(false);
  });

  it("null fails", () => {
    const result = validateHandoffToken(null);
    expect(result.valid).toBe(false);
  });

  it("safe preview does not include protected fields", () => {
    const sourceData = {
      disclosure_name: "성수권역 복합시설",
      area_signal: "성동구 성수권역",
      gross_area_sqm: 1200,
      building_type: "mixed_use",
      exact_address: "서울 성동구 성수동2가 123-45",  // protected
      tenant_name: "스타벅스",                          // protected
      unit_rent: "월세 300만원",                         // protected
    };
    // createSafePreview(payload, sourceData) — using type cast for test stub
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const preview = createSafePreview(STUB_PAYLOAD as any, sourceData);
    expect(preview).not.toHaveProperty("exact_address");
    expect(preview).not.toHaveProperty("tenant_name");
    expect(preview).not.toHaveProperty("unit_rent");
    expect(preview).toHaveProperty("disclosure_name");
  });
});

// ─── Demo B + C: Readiness → Outline ─────────────────────────────────

describe("Demo B+C: readiness and outline happy path", () => {
  const BSSOT = {
    asset_identity: {
      disclosure_name: "성수권역 복합시설",
      area_signal: "성동구 성수권역",
      gross_area_sqm: 1200,
      building_type: "mixed_use",
    },
    lease_income: { rent_roll_available: true, lease_count: 5 },
    missing_data: [],
  };

  it("readiness score is a number 0-100", () => {
    const result = computeReadiness({
      project_id: "proj_001",
      target_output: "buyer_ready_full_im",
      building_ssot_full: BSSOT as Record<string, unknown>,
      evidence_refs: [],
    });
    expect(result.readiness_score).toBeGreaterThanOrEqual(0);
    expect(result.readiness_score).toBeLessThanOrEqual(100);
  });

  it("readiness result has boundary_note", () => {
    const result = computeReadiness({
      project_id: "proj_001",
      target_output: "buyer_ready_full_im",
      building_ssot_full: BSSOT as Record<string, unknown>,
      evidence_refs: [],
    });
    expect(result.boundary_note).toBeTruthy();
  });

  it("outline generates 18 sections", () => {
    const readiness = computeReadiness({
      project_id: "proj_001",
      target_output: "buyer_ready_full_im",
      building_ssot_full: BSSOT as Record<string, unknown>,
      evidence_refs: [],
    });
    const sections = planSections({
      project_id: "proj_001",
      building_ssot_full: BSSOT as Record<string, unknown>,
      readiness_result: readiness,
      target_output: "buyer_ready_full_im",
    });
    expect(sections).toHaveLength(18);
  });

  it("section order is correct (1-18)", () => {
    const readiness = computeReadiness({ project_id: "proj_001", target_output: "buyer_ready_full_im", building_ssot_full: BSSOT as Record<string, unknown>, evidence_refs: [] });
    const sections = planSections({
      project_id: "proj_001",
      building_ssot_full: BSSOT as Record<string, unknown>,
      readiness_result: readiness,
      target_output: "buyer_ready_full_im",
    });
    const orders = sections.map(s => s.section_order);
    expect(orders[0]).toBe(1);
    expect(orders[orders.length - 1]).toBe(18);
  });
});

// ─── Demo E: Financial Guardrail ──────────────────────────────────────

describe("Demo E: financial guardrail blocks unsafe claims", () => {
  // runRiskBoundaryCheck(text: string, sectionType: string): RiskBoundaryResult
  it("blocks '수익률이 보장됩니다'", () => {
    const result = runRiskBoundaryCheck("이 자산의 수익률이 보장됩니다.", "financial_commentary");
    expect(result.safe_text).not.toContain("보장됩니다");
  });

  it("rewrites '대출 가능합니다'", () => {
    const result = runRiskBoundaryCheck("현재 조건으로 대출 가능합니다.", "debt");
    expect(result.safe_text).not.toContain("대출 가능합니다");
  });

  it("blocks '적정 가격입니다'", () => {
    const result = runRiskBoundaryCheck("현재 가격이 적정 가격입니다.", "valuation_logic");
    expect(result.safe_text).not.toContain("적정 가격입니다");
  });

  it("result has safe_text", () => {
    const result = runRiskBoundaryCheck("이 자산의 투자 가치가 높습니다.", "full_im_section");
    // safe_text is always defined (may be the original if no match)
    expect(result.safe_text).toBeDefined();
    expect(result.issues).toBeDefined();
  });
});

// ─── Demo F: Expert Patch ─────────────────────────────────────────────

describe("Demo F: expert patch happy path", () => {
  it("valid patch schema passes", () => {
    const parsed = ExpertPatchSubmitSchema.safeParse({
      project_id: "proj_001",
      expert_role: "cre_consultant",
      patch_type: "financial_assumption_fix",
      after_text: "NOI는 가정 기반 추정이며 시장 상황에 따라 달라질 수 있습니다.",
      edit_tags: ["overclaim_removed", "risk_balance_added"],
      training_rights: "allowed_anonymized",
      visibility_after_review: "internal_only",
    });
    expect(parsed.success).toBe(true);
  });

  it("patch without edit_tags fails schema", () => {
    const parsed = ExpertPatchSubmitSchema.safeParse({
      project_id: "proj_001",
      expert_role: "cre_consultant",
      patch_type: "financial_assumption_fix",
      after_text: "NOI 수정됨",
      edit_tags: [],
      training_rights: "not_allowed",
    });
    expect(parsed.success).toBe(false);
  });

  it("patch without after_text fails schema", () => {
    const parsed = ExpertPatchSubmitSchema.safeParse({
      project_id: "proj_001",
      expert_role: "cre_consultant",
      patch_type: "financial_assumption_fix",
      after_text: "",
      edit_tags: ["overclaim_removed"],
      training_rights: "not_allowed",
    });
    expect(parsed.success).toBe(false);
  });
});

// ─── Demo G: Disclosure Gate blocks P0 ───────────────────────────────

describe("Demo G: disclosure gate blocks P0 violation", () => {
  it("tenant name in output triggers violation", () => {
    // runDisclosureGuard requires full DisclosureGuardInput
    const result = runDisclosureGuard({
      text: "1층에 스타벅스가 입점 중입니다.",
      target_visibility: "buyer_ready",
      protected_fields_available: ["tenant_name"],
      output_type: "full_im",
    });
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("exact address in blind output triggers violation", () => {
    const result = runDisclosureGuard({
      text: "서울 성동구 성수동2가 123-45번지에 위치합니다.",
      target_visibility: "public_blind",
      protected_fields_available: ["exact_address"],
      output_type: "blind_teaser",
    });
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("gate review with P0 blocks buyer_ready", () => {
    const gates = runGateCheck({
      project_id: "proj_001",
      // P0 pattern in markdown — exact address
      sections: [
        { id: "sec_01", section_type: "executive_summary", status: "ai_draft", requires_expert_patch: false, missing_data: [] },
      ],
      building_ssot_full: { disclosure_gate: { protected_fields: ["exact_address", "tenant_name"] } },
      expert_patches: [],
      section_markdown_samples: [
        { section_id: "sec_01", markdown: "서울 성동구 성수동2가 123-45 스타벅스 입점 중", visibility: "public_blind" },
      ],
      readiness_score: 80,
    });
    expect(gates.has_p0_violation).toBe(true);
    expect(gates.buyer_ready_eligible).toBe(false);
  });

  it("broker cannot approve buyer-ready", () => {
    // canApproveBuyerReady(BuyerReadyApprovalInput)
    const result = canApproveBuyerReady({
      actor_role: "broker",
      gate_results: [{ gate_type: "data_gate", status: "pass" }],
      has_p0_violation: false,
      missing_required_patches: [],
    });
    expect(result.can_approve).toBe(false);
  });
});

// ─── Demo I: Export ───────────────────────────────────────────────────

describe("Demo I: export happy path", () => {
  const BASE_ELIGIBILITY = {
    project_id: "proj_001",
    project_status: "buyer_ready",
    has_p0_violation: false,
    gate_overall_status: "pass",
    sections_count: 18,
    buyer_ready_approved: true,
  };

  it("buyer_ready project can export", () => {
    const elig = checkExportEligibility(BASE_ELIGIBILITY);
    expect(elig.can_export_buyer_ready).toBe(true);
  });

  it("draft export always allowed", () => {
    const elig = checkExportEligibility({
      ...BASE_ELIGIBILITY,
      project_status: "ai_draft",
      buyer_ready_approved: false,
    });
    expect(elig.can_export_draft).toBe(true);
  });

  it("buyer_ready export blocked before approval", () => {
    const elig = checkExportEligibility({
      ...BASE_ELIGIBILITY,
      project_status: "ai_draft",
      buyer_ready_approved: false,
    });
    expect(elig.can_export_buyer_ready).toBe(false);
  });

  it("markdown export includes STANDARD_DISCLAIMER", () => {
    const md = buildMarkdownExport({
      project_id: "proj_001",
      project_status: "buyer_ready",
      export_mode: "buyer_ready",
      sections: [
        {
          section_order: 1,
          title: "Executive Summary",
          markdown: "내용",
        },
      ],
      boundary_note: STANDARD_DISCLAIMER,
      generated_at: new Date().toISOString(),
    });
    expect(md).toContain(STANDARD_DISCLAIMER);
  });

  it("draft export markdown includes DRAFT_LABEL", () => {
    const md = buildMarkdownExport({
      project_id: "proj_001",
      project_status: "ai_draft",
      export_mode: "draft",
      sections: [
        {
          section_order: 1,
          title: "Executive Summary",
          markdown: "내용",
        },
      ],
      boundary_note: STANDARD_DISCLAIMER,
      generated_at: new Date().toISOString(),
    });
    expect(md).toContain(DRAFT_LABEL);
  });
});

// ─── Demo J: Golden Dataset ───────────────────────────────────────────

describe("Demo J: golden dataset happy path", () => {
  it("full pipeline: create → redact → approve", () => {
    const candidate = createGoldenCandidate({
      project_id: "proj_001",
      section_type: "income_noi_yield_analysis",
      ai_draft: "NOI는 보장됩니다.",
      expert_revision: "NOI는 가정 기반 추정입니다.",
      edit_tags: ["overclaim_removed"],
      training_rights: "allowed_anonymized",
    });
    expect(candidate.review_status).toBe("candidate");

    const redacted = redactCandidate(candidate);
    expect(redacted.redaction_status).toBe("redacted");

    const approved = approveCandidate(redacted, "reviewer_001");
    expect(approved.review_status).toBe("approved");
  });

  it("cannot approve with not_allowed training_rights", () => {
    const candidate = createGoldenCandidate({
      project_id: "proj_001",
      ai_draft: "NOI 추정",
      expert_revision: "NOI 수정",
      edit_tags: ["overclaim_removed"],
      training_rights: "not_allowed",
    });
    const redacted = redactCandidate(candidate);
    expect(() => approveCandidate(redacted, "reviewer_001")).toThrow("training_rights");
  });
});

// ─── Next Best Action ─────────────────────────────────────────────────

describe("Next Best Action: docs/23 §14", () => {
  it("newly created project → run_readiness", () => {
    const action = computeNextBestAction({
      status: "created",
      readiness_score: null,
      sections_count: 0,
      has_outline: false,
      has_ai_drafts: false,
      gate_status: "not_run",
      has_p0_violation: false,
      expert_patches_required: 0,
      project_id: "proj_001",
    });
    expect(action.action_key).toBe("run_readiness");
    expect(action.cta_url).toContain("proj_001");
  });

  it("gate passed → export", () => {
    const action = computeNextBestAction({
      status: "buyer_ready",
      readiness_score: 90,
      sections_count: 18,
      has_outline: true,
      has_ai_drafts: true,
      gate_status: "pass",
      has_p0_violation: false,
      expert_patches_required: 0,
      project_id: "proj_001",
    });
    expect(action.action_key).toBe("export");
  });
});

// ─── Commercial Readiness Score ───────────────────────────────────────

describe("computePilotReadinessScore: docs/34 §13", () => {
  const FULL_READY: CommercialReadinessInput = {
    handoff_import: true,
    bssot_full_created: true,
    readiness_score_shown: true,
    outline_18_sections: true,
    ai_draft_works: true,
    section_editor_usable: true,
    expert_workbench_usable: true,
    gate_review_blocks_unsafe: true,
    export_preview_works: true,
    disclaimer_included: true,
    ai_safety_validated: true,
    disclosure_guard_active: true,
    expert_patch_auditable: true,
    gate_events_recorded: true,
    buyer_ready_guard_works: true,
    admin_analytics_visible: true,
    empty_states_helpful: true,
    error_states_safe: true,
    next_best_action_shown: true,
    loading_states_exist: true,
  };

  it("pilot threshold: score >= 16 for ready system", () => {
    const score = computePilotReadinessScore(FULL_READY);
    expect(score.total).toBeGreaterThanOrEqual(16);
    expect(score.is_pilot_ready).toBe(true);
  });

  it("score below 16 → not pilot ready", () => {
    const partial: CommercialReadinessInput = {
      ...FULL_READY,
      readiness_score_shown: false,
      outline_18_sections: false,
      ai_draft_works: false,
      section_editor_usable: false,
      expert_workbench_usable: false,
      gate_review_blocks_unsafe: false,
      export_preview_works: false,
      disclaimer_included: false,
      ai_safety_validated: false,
      disclosure_guard_active: false,
    };
    const score = computePilotReadinessScore(partial);
    expect(score.total).toBeLessThan(16);
    expect(score.is_pilot_ready).toBe(false);
  });

  it("p0_disclosure_issue → not pilot ready regardless of score", () => {
    const score = computePilotReadinessScore({ ...FULL_READY, p0_disclosure_issue: true });
    expect(score.is_pilot_ready).toBe(false);
    expect(score.p0_disclosure_issue).toBe(true);
  });

  it("failing_items lists incomplete checklist items", () => {
    const score = computePilotReadinessScore({ ...FULL_READY, loading_states_exist: false });
    expect(score.failing_items.length).toBeGreaterThan(0);
    expect(score.total).toBe(19);
  });
});

// ─── UX State Helpers ─────────────────────────────────────────────────

describe("UX State helpers", () => {
  it("makeEmptyState returns helpful description for sections", () => {
    const state = makeEmptyState("sections");
    expect(state.title).toBeTruthy();
    expect(state.description).toBeTruthy();
    expect(state.icon).toBeTruthy();
  });

  it("makeErrorState is always safe (no private data)", () => {
    const state = makeErrorState("EXPORT_BLOCKED");
    expect(state.is_safe).toBe(true);
  });

  it("makeErrorState includes retry flag", () => {
    const state = makeErrorState("AI_FAILED", true);
    expect(state.retry_available).toBe(true);
  });

  it("makeLoadingState shows loading message", () => {
    const state = makeLoadingState("AI 초안 생성");
    expect(state.is_loading).toBe(true);
    expect(state.message).toContain("AI 초안 생성");
  });
});
