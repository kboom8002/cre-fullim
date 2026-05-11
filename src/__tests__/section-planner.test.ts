/**
 * Unit Tests: IM Section Planner (Slice 5)
 *
 * Tests for:
 *   - docs/12-api-contracts.md §6.1 Generate Outline
 *   - docs/15-ai-agent-contracts.md §6 IMSectionPlannerAgent
 *   - docs/10-domain-model.md §3.4 IM Section (18 required sections)
 *   - docs/24-section-editor-spec.md §4 Left Panel Navigation
 *
 * Rules:
 *   - exactly 18 sections, correct order, unique types
 *   - statuses reflect readiness result
 *   - high-risk sections always require expert_patch
 *   - duplicate generation does not create more than 18
 */
import { describe, it, expect } from "vitest";
import {
  planSections,
  mergeSectionUpdates,
  getSectionTemplate,
  IM_SECTION_DEFINITIONS,
  type SectionPlan,
  type SectionPlanInput,
} from "@/domain/sections/section-planner";
import { IM_SECTIONS_18 } from "@/domain/readiness/readiness-service";

// ─── Fixtures ─────────────────────────────────────────────────────────

const BASE_INPUT: SectionPlanInput = {
  project_id: "proj_001",
  target_output: "buyer_ready_full_im",
  building_ssot_full: {
    asset_identity: { area_signal: "성수권역", asset_type: "꼬마빌딩", _source: "building_ssot_lite" },
    physical_fact: { size_signal: "연면적 500㎡", _source: "building_ssot_lite" },
    legal_registry: {},
    lease_income: { rent_roll_confirmed: false, operating_expenses_confirmed: false },
    market_location: {},
    risk_unknown: { risk_items: [] },
    buyer_fit: { fit_summary: "수익형" },
    disclosure_gate: { protected_fields: ["exact_address"] },
    evidence_source: { source_refs: [], evidence_refs: [] },
  },
  readiness_result: {
    readiness_score: 40,
    available_outputs: ["blind_teaser", "external_snapshot"],
    blocked_outputs: ["im_lite", "full_im_draft", "buyer_ready_full_im"],
    missing_required_data: ["rent_roll", "registry", "operating_expenses"],
    required_expert_patches: [],
    section_readiness: [],
    boundary_note: "예비 검토 결과입니다.",
  },
};

const HIGH_READINESS_INPUT: SectionPlanInput = {
  ...BASE_INPUT,
  project_id: "proj_002",
  building_ssot_full: {
    ...BASE_INPUT.building_ssot_full,
    legal_registry: { registry_confirmed: true, land_use_plan_confirmed: true },
    lease_income: { rent_roll_confirmed: true, operating_expenses_confirmed: true, vacancy_summary: "완전임대" },
    market_location: { location_analysis: "역세권" },
    evidence_source: {
      source_refs: [],
      evidence_refs: [
        { type: "registry", id: "ev_01" },
        { type: "rent_roll", id: "ev_02" },
        { type: "floor_plan", id: "ev_03" },
        { type: "photo", id: "ev_04" },
      ],
    },
  },
  readiness_result: {
    readiness_score: 82,
    available_outputs: ["blind_teaser", "external_snapshot", "im_lite", "full_im_draft"],
    blocked_outputs: ["buyer_ready_full_im"],
    missing_required_data: [],
    required_expert_patches: [],
    section_readiness: [],
    boundary_note: "예비 검토 결과입니다.",
  },
};

// ─── 1. 18 sections, correct order ────────────────────────────────────

describe("planSections: 18 sections", () => {
  it("creates exactly 18 sections", () => {
    const sections = planSections(BASE_INPUT);
    expect(sections).toHaveLength(18);
  });

  it("section_order starts at 1 and is sequential", () => {
    const sections = planSections(BASE_INPUT);
    const orders = sections.map((s) => s.section_order);
    expect(orders[0]).toBe(1);
    expect(orders[17]).toBe(18);
    for (let i = 0; i < 17; i++) {
      expect(orders[i + 1]).toBe(orders[i] + 1);
    }
  });

  it("all 18 standard section types are present", () => {
    const sections = planSections(BASE_INPUT);
    const types = sections.map((s) => s.section_type);
    for (const required of IM_SECTIONS_18) {
      expect(types).toContain(required);
    }
  });

  it("no duplicate section_types", () => {
    const sections = planSections(BASE_INPUT);
    const types = sections.map((s) => s.section_type);
    const unique = new Set(types);
    expect(unique.size).toBe(18);
  });

  it("first section is cover_confidentiality", () => {
    const sections = planSections(BASE_INPUT);
    expect(sections[0].section_type).toBe("cover_confidentiality");
  });

  it("last section is disclaimer_contact", () => {
    const sections = planSections(BASE_INPUT);
    expect(sections[17].section_type).toBe("disclaimer_contact");
  });
});

// ─── 2. Section statuses reflect readiness ────────────────────────────

describe("planSections: status reflects readiness", () => {
  it("cover_confidentiality and disclaimer are always planned", () => {
    const sections = planSections(BASE_INPUT);
    const cover = sections.find((s) => s.section_type === "cover_confidentiality");
    const disc = sections.find((s) => s.section_type === "disclaimer_contact");
    expect(cover!.status).toBe("planned");
    expect(disc!.status).toBe("planned");
  });

  it("income_noi_yield_analysis is needs_data when rent_roll missing", () => {
    const sections = planSections(BASE_INPUT);
    const noi = sections.find((s) => s.section_type === "income_noi_yield_analysis");
    expect(noi!.status).toBe("needs_data");
  });

  it("income_noi_yield_analysis is planned when rent_roll + opex present", () => {
    const sections = planSections(HIGH_READINESS_INPUT);
    const noi = sections.find((s) => s.section_type === "income_noi_yield_analysis");
    expect(["planned", "needs_expert_patch"]).toContain(noi!.status);
  });

  it("debt_sensitivity_cash_flow always needs_expert_patch (docs/17 §7)", () => {
    const sections = planSections(HIGH_READINESS_INPUT);
    const debt = sections.find((s) => s.section_type === "debt_sensitivity_cash_flow");
    expect(debt!.status).toBe("needs_expert_patch");
  });

  it("valuation_logic_comparables always needs_expert_patch (docs/17 §8)", () => {
    const sections = planSections(HIGH_READINESS_INPUT);
    const val = sections.find((s) => s.section_type === "valuation_logic_comparables");
    expect(val!.status).toBe("needs_expert_patch");
  });

  it("land_zoning_legal_constraints is needs_data when registry missing", () => {
    const sections = planSections(BASE_INPUT);
    const legal = sections.find((s) => s.section_type === "land_zoning_legal_constraints");
    expect(legal!.status).toBe("needs_data");
  });
});

// ─── 3. Confidence and risk ───────────────────────────────────────────

describe("planSections: confidence and risk_level", () => {
  it("each section has a valid confidence value", () => {
    const sections = planSections(BASE_INPUT);
    const validConf = ["confirmed", "inferred", "needs_evidence", "expert_required", "unknown"];
    for (const s of sections) {
      expect(validConf).toContain(s.confidence);
    }
  });

  it("each section has a valid risk_level", () => {
    const sections = planSections(BASE_INPUT);
    const validRisk = ["low", "medium", "high", "blocked"];
    for (const s of sections) {
      expect(validRisk).toContain(s.risk_level);
    }
  });

  it("income_noi_yield_analysis has risk_level high", () => {
    const sections = planSections(BASE_INPUT);
    const noi = sections.find((s) => s.section_type === "income_noi_yield_analysis");
    expect(noi!.risk_level).toBe("high");
  });

  it("debt_sensitivity_cash_flow has risk_level high", () => {
    const sections = planSections(BASE_INPUT);
    const debt = sections.find((s) => s.section_type === "debt_sensitivity_cash_flow");
    expect(debt!.risk_level).toBe("high");
  });

  it("cover_confidentiality has risk_level low", () => {
    const sections = planSections(BASE_INPUT);
    const cover = sections.find((s) => s.section_type === "cover_confidentiality");
    expect(cover!.risk_level).toBe("low");
  });
});

// ─── 4. Expert patch requirements ────────────────────────────────────

describe("planSections: requires_expert_patch", () => {
  it("debt and valuation sections always require expert patch", () => {
    const sections = planSections(BASE_INPUT);
    const debt = sections.find((s) => s.section_type === "debt_sensitivity_cash_flow");
    const val = sections.find((s) => s.section_type === "valuation_logic_comparables");
    expect(debt!.requires_expert_patch).toBe(true);
    expect(val!.requires_expert_patch).toBe(true);
  });

  it("cover_confidentiality does not require expert patch", () => {
    const sections = planSections(BASE_INPUT);
    const cover = sections.find((s) => s.section_type === "cover_confidentiality");
    expect(cover!.requires_expert_patch).toBe(false);
  });

  it("sections with requires_expert_patch have required_expert_roles", () => {
    const sections = planSections(BASE_INPUT);
    for (const s of sections.filter((s) => s.requires_expert_patch)) {
      expect(s.required_expert_roles.length).toBeGreaterThan(0);
    }
  });
});

// ─── 5. Duplicate outline prevention ─────────────────────────────────

describe("mergeSectionUpdates: idempotency", () => {
  it("merging same sections twice does not duplicate", () => {
    const sections = planSections(BASE_INPUT);
    const existing = [...sections];
    const merged = mergeSectionUpdates(existing, sections);
    expect(merged).toHaveLength(18);
  });

  it("merged result preserves all 18 section types", () => {
    const sections = planSections(BASE_INPUT);
    const merged = mergeSectionUpdates(sections, sections);
    const types = new Set(merged.map((s) => s.section_type));
    expect(types.size).toBe(18);
  });
});

// ─── 6. Section templates ─────────────────────────────────────────────

describe("getSectionTemplate", () => {
  it("returns template for income_noi_yield_analysis", () => {
    const tmpl = getSectionTemplate("income_noi_yield_analysis");
    expect(tmpl).toBeDefined();
    expect(tmpl!.structure).toContain("NOI");
  });

  it("returns template for risk_factors_dd_checklist", () => {
    const tmpl = getSectionTemplate("risk_factors_dd_checklist");
    expect(tmpl).toBeDefined();
    expect(tmpl!.structure).toContain("Risk");
  });

  it("IM_SECTION_DEFINITIONS has 18 entries", () => {
    expect(Object.keys(IM_SECTION_DEFINITIONS)).toHaveLength(18);
  });
});
