/**
 * Unit Tests: IM Readiness Engine (Slice 4)
 *
 * Tests for:
 *   - docs/15-ai-agent-contracts.md §4 IMReadinessAgent
 *   - docs/17-financial-analysis-guardrails.md §11 Expert Review Triggers
 *   - docs/23-full-im-studio-dashboard.md §6 Score Bands
 *
 * Rules:
 *   - missing rent_roll blocks buyer_ready_full_im
 *   - missing operating_expenses affects NOI sections
 *   - readiness_score maps to output availability bands
 *   - required expert patches are recommended deterministically
 *   - im_readiness_checked event schema is valid
 */
import { describe, it, expect } from "vitest";
import {
  computeReadiness,
  scoreToAvailability,
  recommendExpertPatches,
  buildSectionReadiness,
  type ReadinessInput,
  type ReadinessResult,
  type OutputAvailability,
  type ExpertPatchRecommendation,
} from "@/domain/readiness/readiness-service";

// ─── Fixtures ─────────────────────────────────────────────────────────

/** Full data — high readiness */
const FULL_BSSOT: ReadinessInput = {
  project_id: "proj_001",
  target_output: "buyer_ready_full_im",
  building_ssot_full: {
    asset_identity: { area_signal: "성수권역", asset_type: "꼬마빌딩", price_band: "50~80억", _source: "building_ssot_lite" },
    physical_fact: { size_signal: "연면적 500㎡", current_use_signal: "근린생활시설", _source: "building_ssot_lite" },
    legal_registry: { registry_confirmed: true, land_use_plan_confirmed: true },
    lease_income: {
      vacancy_summary: "1층 공실",
      rent_roll_confirmed: true,
      lease_summary_confirmed: true,
      operating_expenses_confirmed: true,
    },
    market_location: { location_analysis: "강남인접 역세권" },
    risk_unknown: { risk_items: [{ description: "공실 리스크", source: "caution_summary_lite", confidence: "medium" }] },
    buyer_fit: { fit_summary: "수익형 투자 적합", _source: "building_ssot_lite" },
    disclosure_gate: { protected_fields: ["exact_address"], guard_checked: true },
    evidence_source: {
      source_refs: [{ type: "building_ssot_lite", id: "bsl_001", source: "lite_import" }],
      evidence_refs: [
        { type: "registry", id: "ev_001", visibility: "internal_only" },
        { type: "rent_roll", id: "ev_002", visibility: "internal_only" },
        { type: "floor_plan", id: "ev_003", visibility: "internal_only" },
        { type: "photo", id: "ev_004", visibility: "internal_only" },
      ],
    },
  },
  evidence_refs: [
    { type: "registry", id: "ev_001" },
    { type: "rent_roll", id: "ev_002" },
    { type: "floor_plan", id: "ev_003" },
    { type: "photo", id: "ev_004" },
  ],
};

/** Missing rent_roll and operating_expenses */
const NO_RENT_ROLL_BSSOT: ReadinessInput = {
  project_id: "proj_002",
  target_output: "buyer_ready_full_im",
  building_ssot_full: {
    asset_identity: { area_signal: "마포권역", asset_type: "꼬마빌딩", _source: "building_ssot_lite" },
    physical_fact: { size_signal: "연면적 300㎡", _source: "building_ssot_lite" },
    legal_registry: {},
    lease_income: {
      vacancy_summary: "2층 공실",
      rent_roll_confirmed: false,   // ← NO rent roll
      operating_expenses_confirmed: false, // ← NO opex
    },
    market_location: {},
    risk_unknown: { risk_items: [] },
    buyer_fit: { fit_summary: null },
    disclosure_gate: { protected_fields: ["exact_address", "tenant_name", "unit_rent"], guard_checked: true },
    evidence_source: { source_refs: [], evidence_refs: [] },
  },
  evidence_refs: [],
};

/** Minimal — only area_signal */
const MINIMAL_BSSOT: ReadinessInput = {
  project_id: "proj_003",
  target_output: "im_lite",
  building_ssot_full: {
    asset_identity: { area_signal: "성동구", _source: "building_ssot_lite" },
    physical_fact: { _source: "building_ssot_lite" },
    legal_registry: {},
    lease_income: {},
    market_location: {},
    risk_unknown: { risk_items: [] },
    buyer_fit: {},
    disclosure_gate: { protected_fields: [], guard_checked: false },
    evidence_source: { source_refs: [], evidence_refs: [] },
  },
  evidence_refs: [],
};

// ─── 1. Rent roll blocks buyer_ready ──────────────────────────────────

describe("computeReadiness: rent_roll blocking", () => {
  it("missing rent_roll blocks buyer_ready_full_im output", () => {
    const result = computeReadiness(NO_RENT_ROLL_BSSOT);
    const buyerReady = result.blocked_outputs.includes("buyer_ready_full_im");
    expect(buyerReady).toBe(true);
  });

  it("missing rent_roll is listed in missing_required_data", () => {
    const result = computeReadiness(NO_RENT_ROLL_BSSOT);
    expect(result.missing_required_data).toContain("rent_roll");
  });

  it("with rent_roll confirmed, score is significantly higher than without", () => {
    // buyer_ready_full_im is ALWAYS blocked by gate rule (docs/15 §4 Must Not)
    // but rent_roll confirmed should raise score vs missing rent_roll
    const resultFull = computeReadiness(FULL_BSSOT);
    const resultNoRoll = computeReadiness(NO_RENT_ROLL_BSSOT);
    expect(resultFull.readiness_score).toBeGreaterThan(resultNoRoll.readiness_score);
  });
});

// ─── 2. Operating expenses affects NOI section ────────────────────────

describe("computeReadiness: operating_expenses → NOI section", () => {
  it("missing operating_expenses blocks income_noi_yield_analysis section", () => {
    const result = computeReadiness(NO_RENT_ROLL_BSSOT);
    const noi = result.section_readiness.find(
      (s) => s.section_type === "income_noi_yield_analysis",
    );
    expect(noi).toBeDefined();
    expect(noi!.status).toBe("blocked");
  });

  it("missing operating_expenses is in NOI section missing_data", () => {
    const result = computeReadiness(NO_RENT_ROLL_BSSOT);
    const noi = result.section_readiness.find(
      (s) => s.section_type === "income_noi_yield_analysis",
    );
    expect(noi!.missing_data).toContain("operating_expenses");
  });

  it("with operating_expenses confirmed, NOI section is not blocked", () => {
    const result = computeReadiness(FULL_BSSOT);
    const noi = result.section_readiness.find(
      (s) => s.section_type === "income_noi_yield_analysis",
    );
    // May be partial but not blocked
    expect(noi!.status).not.toBe("blocked");
  });
});

// ─── 3. Score bands → output availability ────────────────────────────

describe("scoreToAvailability", () => {
  it("score 0~30: only blind_teaser available", () => {
    const avail = scoreToAvailability(20);
    expect(avail.find((a) => a.output === "blind_teaser")?.available).toBe(true);
    expect(avail.find((a) => a.output === "im_lite")?.available).toBe(false);
    expect(avail.find((a) => a.output === "buyer_ready_full_im")?.available).toBe(false);
  });

  it("score 31~50: external_snapshot available", () => {
    const avail = scoreToAvailability(40);
    expect(avail.find((a) => a.output === "external_snapshot")?.available).toBe(true);
    expect(avail.find((a) => a.output === "im_lite")?.available).toBe(false);
  });

  it("score 51~70: im_lite available", () => {
    const avail = scoreToAvailability(60);
    expect(avail.find((a) => a.output === "im_lite")?.available).toBe(true);
    expect(avail.find((a) => a.output === "buyer_ready_full_im")?.available).toBe(false);
  });

  it("score 71~85: full_im_draft available but buyer_ready blocked", () => {
    const avail = scoreToAvailability(78);
    expect(avail.find((a) => a.output === "full_im_draft")?.available).toBe(true);
    expect(avail.find((a) => a.output === "buyer_ready_full_im")?.available).toBe(false);
  });

  it("score 86~100: buyer_ready_full_im conditionally available (still needs gate)", () => {
    const avail = scoreToAvailability(90);
    const br = avail.find((a) => a.output === "buyer_ready_full_im");
    expect(br?.available).toBe(false);   // always false without gate pass
    expect(br?.reason).toContain("gate");
  });

  it("all outputs have a reason string", () => {
    const avail = scoreToAvailability(50);
    for (const item of avail) {
      expect(typeof item.reason).toBe("string");
      expect(item.reason.length).toBeGreaterThan(0);
    }
  });
});

// ─── 4. Required expert patches recommended ──────────────────────────

describe("recommendExpertPatches", () => {
  it("missing operating_expenses triggers cre_consultant patch for NOI section", () => {
    const patches = recommendExpertPatches(NO_RENT_ROLL_BSSOT.building_ssot_full);
    const noi = patches.find(
      (p) => p.section_type === "income_noi_yield_analysis",
    );
    expect(noi).toBeDefined();
    expect(noi!.expert_role).toBe("cre_consultant");
    expect(noi!.priority).toBe("high");
  });

  it("missing rent_roll triggers cre_consultant patch for rent_roll section", () => {
    const patches = recommendExpertPatches(NO_RENT_ROLL_BSSOT.building_ssot_full);
    const rr = patches.find((p) => p.section_type === "rent_roll_lease_quality");
    expect(rr).toBeDefined();
    expect(rr!.priority).toBe("high");
  });

  it("no patches needed when core data complete", () => {
    const patches = recommendExpertPatches(FULL_BSSOT.building_ssot_full);
    // May still recommend some (buyer-ready always needs expert), but NOI/rent roll are not triggered
    const noi = patches.find(
      (p) => p.section_type === "income_noi_yield_analysis" && p.priority === "high",
    );
    expect(noi).toBeUndefined();
  });

  it("each patch has required fields", () => {
    const patches = recommendExpertPatches(NO_RENT_ROLL_BSSOT.building_ssot_full);
    for (const p of patches) {
      expect(p.section_type).toBeDefined();
      expect(p.expert_role).toBeDefined();
      expect(p.patch_type).toBeDefined();
      expect(p.reason).toBeDefined();
      expect(["low", "medium", "high"]).toContain(p.priority);
    }
  });
});

// ─── 5. Section readiness builder ────────────────────────────────────

describe("buildSectionReadiness", () => {
  it("returns 18 sections", () => {
    const sections = buildSectionReadiness(NO_RENT_ROLL_BSSOT.building_ssot_full);
    expect(sections).toHaveLength(18);
  });

  it("every section has section_type and status", () => {
    const sections = buildSectionReadiness(FULL_BSSOT.building_ssot_full);
    for (const s of sections) {
      expect(typeof s.section_type).toBe("string");
      expect(["ready", "partial", "blocked"]).toContain(s.status);
      expect(typeof s.expert_required).toBe("boolean");
    }
  });

  it("debt_sensitivity section requires expert_required=true always", () => {
    const sections = buildSectionReadiness(MINIMAL_BSSOT.building_ssot_full);
    const debt = sections.find((s) => s.section_type === "debt_sensitivity_cash_flow");
    expect(debt!.expert_required).toBe(true);
  });

  it("valuation section requires expert_required=true always", () => {
    const sections = buildSectionReadiness(MINIMAL_BSSOT.building_ssot_full);
    const val = sections.find((s) => s.section_type === "valuation_logic_comparables");
    expect(val!.expert_required).toBe(true);
  });
});

// ─── 6. computeReadiness output schema ───────────────────────────────

describe("computeReadiness: output schema", () => {
  it("readiness_score is between 0 and 100", () => {
    const result = computeReadiness(FULL_BSSOT);
    expect(result.readiness_score).toBeGreaterThanOrEqual(0);
    expect(result.readiness_score).toBeLessThanOrEqual(100);
  });

  it("minimal data yields score <= 30", () => {
    const result = computeReadiness(MINIMAL_BSSOT);
    expect(result.readiness_score).toBeLessThanOrEqual(30);
  });

  it("full data yields score >= 75", () => {
    const result = computeReadiness(FULL_BSSOT);
    expect(result.readiness_score).toBeGreaterThanOrEqual(75);
  });

  it("boundary_note is non-empty string", () => {
    const result = computeReadiness(NO_RENT_ROLL_BSSOT);
    expect(typeof result.boundary_note).toBe("string");
    expect(result.boundary_note.length).toBeGreaterThan(10);
  });

  it("available_outputs and blocked_outputs do not overlap", () => {
    const result = computeReadiness(NO_RENT_ROLL_BSSOT);
    const overlap = result.available_outputs.filter((o) =>
      result.blocked_outputs.includes(o),
    );
    expect(overlap).toHaveLength(0);
  });
});
