/**
 * Unit Tests: BSSoT Upgrade Service (Slice 3)
 *
 * Tests for docs/07-import-from-bssot-lite.md §6 Lite-to-Full Mapping.
 *
 * Rules:
 *   - area_signal → asset_identity.area_signal
 *   - hidden_fields → disclosure_gate.protected_fields
 *   - unknown fields become missing_data, not invented facts
 *   - source_refs preserved in evidence_source
 *   - no field ever invented without source data
 */
import { describe, it, expect } from "vitest";
import {
  upgradeLiteToFull,
  detectMissingData,
  classifyProtectedFields,
  buildSourceRefs,
  type BSSoTLiteInput,
  type BSSoTFullDraft,
  type MissingDataItem,
} from "@/domain/bssot/upgrade-service";

// ─── Fixtures ─────────────────────────────────────────────────────────

const FULL_LITE: BSSoTLiteInput = {
  id: "bsl_001",
  area_signal: "성수권역",
  asset_type: "근생형 꼬마빌딩",
  price_band: "50~80억",
  size_signal: "연면적 약 500㎡",
  current_use_signal: "근린생활시설",
  vacancy_signal: "1층 공실",
  fit_summary: "수익형 투자 적합",
  caution_summary: "1층 공실 리스크 존재",
  hidden_fields: ["exact_address", "tenant_name", "unit_rent"],
  status: "public_signal_ready",
  disclosure: { guard_checked: true },
  source_refs: [{ type: "building_ssot_lite", id: "bsl_001" }],
  evidence_refs: [{ type: "building_register", id: "ev_001", visibility: "internal_only" }],
  confidence: "medium",
};

const MINIMAL_LITE: BSSoTLiteInput = {
  id: "bsl_002",
  area_signal: "마포권역",
  asset_type: null,
  price_band: null,
  size_signal: null,
  current_use_signal: null,
  vacancy_signal: null,
  fit_summary: null,
  caution_summary: null,
  hidden_fields: [],
  status: "public_signal_ready",
  disclosure: {},
  source_refs: [],
  evidence_refs: [],
  confidence: "low",
};

// ─── 1. asset_identity mapping ────────────────────────────────────────

describe("upgradeLiteToFull: asset_identity", () => {
  it("area_signal maps to asset_identity.area_signal", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.asset_identity.area_signal).toBe("성수권역");
  });

  it("asset_type maps to asset_identity.asset_type", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.asset_identity.asset_type).toBe("근생형 꼬마빌딩");
  });

  it("price_band maps to asset_identity.price_band", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.asset_identity.price_band).toBe("50~80억");
  });

  it("null asset_type stays null, not invented", () => {
    const draft = upgradeLiteToFull(MINIMAL_LITE, "user_001");
    expect(draft.asset_identity.asset_type).toBeNull();
  });

  it("source is tagged as building_ssot_lite", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.asset_identity._source).toBe("building_ssot_lite");
  });
});

// ─── 2. physical_fact mapping ─────────────────────────────────────────

describe("upgradeLiteToFull: physical_fact", () => {
  it("size_signal maps to physical_fact.size_signal", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.physical_fact.size_signal).toBe("연면적 약 500㎡");
  });

  it("current_use_signal maps to physical_fact.current_use_signal", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.physical_fact.current_use_signal).toBe("근린생활시설");
  });

  it("null size_signal stays null", () => {
    const draft = upgradeLiteToFull(MINIMAL_LITE, "user_001");
    expect(draft.physical_fact.size_signal).toBeNull();
  });
});

// ─── 3. lease_income mapping ──────────────────────────────────────────

describe("upgradeLiteToFull: lease_income", () => {
  it("vacancy_signal maps to lease_income.vacancy_summary", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.lease_income.vacancy_summary).toBe("1층 공실");
  });
});

// ─── 4. buyer_fit mapping ─────────────────────────────────────────────

describe("upgradeLiteToFull: buyer_fit", () => {
  it("fit_summary maps to buyer_fit.fit_summary", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.buyer_fit.fit_summary).toBe("수익형 투자 적합");
  });

  it("null fit_summary stays null, not invented", () => {
    const draft = upgradeLiteToFull(MINIMAL_LITE, "user_001");
    expect(draft.buyer_fit.fit_summary).toBeNull();
  });
});

// ─── 5. risk_unknown mapping ──────────────────────────────────────────

describe("upgradeLiteToFull: risk_unknown", () => {
  it("caution_summary maps to risk_unknown.risk_items[0]", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.risk_unknown.risk_items).toHaveLength(1);
    expect(draft.risk_unknown.risk_items[0].description).toBe("1층 공실 리스크 존재");
  });

  it("null caution_summary produces empty risk_items", () => {
    const draft = upgradeLiteToFull(MINIMAL_LITE, "user_001");
    expect(draft.risk_unknown.risk_items).toHaveLength(0);
  });
});

// ─── 6. disclosure_gate: hidden_fields → protected_fields ────────────

describe("classifyProtectedFields / disclosure_gate", () => {
  it("hidden_fields map to disclosure_gate.protected_fields", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.disclosure_gate.protected_fields).toContain("exact_address");
    expect(draft.disclosure_gate.protected_fields).toContain("tenant_name");
    expect(draft.disclosure_gate.protected_fields).toContain("unit_rent");
  });

  it("empty hidden_fields produces empty protected_fields", () => {
    const draft = upgradeLiteToFull(MINIMAL_LITE, "user_001");
    expect(draft.disclosure_gate.protected_fields).toHaveLength(0);
  });

  it("classifyProtectedFields standalone function", () => {
    const result = classifyProtectedFields(["exact_address", "tenant_name"]);
    expect(result).toEqual(["exact_address", "tenant_name"]);
  });

  it("disclosure_gate includes guard_checked from source", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.disclosure_gate.guard_checked).toBe(true);
  });

  it("visibility_default is internal_only (not public)", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.disclosure_gate.visibility_default).toBe("internal_only");
  });
});

// ─── 7. evidence_source: source_refs preserved ───────────────────────

describe("buildSourceRefs / evidence_source", () => {
  it("source_refs are preserved from lite", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.evidence_source.source_refs).toHaveLength(1);
    expect(draft.evidence_source.source_refs[0].id).toBe("bsl_001");
  });

  it("evidence_refs are preserved from lite", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.evidence_source.evidence_refs).toHaveLength(1);
    expect(draft.evidence_source.evidence_refs[0].id).toBe("ev_001");
  });

  it("empty source_refs produces empty array, not invented data", () => {
    const draft = upgradeLiteToFull(MINIMAL_LITE, "user_001");
    expect(draft.evidence_source.source_refs).toHaveLength(0);
  });

  it("buildSourceRefs standalone normalizes source refs", () => {
    const refs = buildSourceRefs([{ type: "building_ssot_lite", id: "bsl_001" }]);
    expect(refs[0].source).toBe("lite_import");
  });
});

// ─── 8. Missing data detection ───────────────────────────────────────

describe("detectMissingData", () => {
  it("detects missing exact_address as required_for_full_im_draft", () => {
    const missing = detectMissingData(FULL_LITE);
    const item = missing.find((m) => m.field === "exact_address");
    expect(item).toBeDefined();
    expect(item?.required_for).toBe("required_for_full_im_draft");
    expect(item?.reason).toContain("protected");
  });

  it("detects missing land_area as required_for_buyer_ready", () => {
    const missing = detectMissingData(FULL_LITE);
    const item = missing.find((m) => m.field === "land_area");
    expect(item).toBeDefined();
    expect(item?.required_for).toBe("required_for_buyer_ready");
  });

  it("detects missing rent_roll as required_for_full_im_draft", () => {
    const missing = detectMissingData(FULL_LITE);
    const item = missing.find((m) => m.field === "rent_roll");
    expect(item).toBeDefined();
  });

  it("detects missing floor_plan as required_for_buyer_ready", () => {
    const missing = detectMissingData(FULL_LITE);
    const item = missing.find((m) => m.field === "floor_plan");
    expect(item).toBeDefined();
  });

  it("all missing items have required_for classification", () => {
    const missing = detectMissingData(FULL_LITE);
    for (const item of missing) {
      expect(["required_for_im_lite", "required_for_full_im_draft", "required_for_buyer_ready", "optional_enrichment"])
        .toContain(item.required_for);
    }
  });
});

// ─── 9. No invented facts ────────────────────────────────────────────

describe("No invented facts invariant", () => {
  it("unset layers are empty objects not inventions", () => {
    const draft = upgradeLiteToFull(MINIMAL_LITE, "user_001");
    // These layers have no lite source — must be empty, never filled with guesses
    expect(draft.legal_registry).toEqual({});
    expect(draft.market_location).toEqual({});
    expect(draft.value_up_hypothesis).toEqual({});
    expect(draft.b2c_consumer_demand).toEqual({});
    expect(draft.space_environmental).toEqual({});
    expect(draft.tenant_operator_management).toEqual({});
    expect(draft.ai_answer_document_contract).toEqual({});
  });

  it("readiness_status is lite_imported, not full_im_draft_ready", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_001");
    expect(draft.readiness_status).toBe("lite_imported");
  });

  it("created_by is preserved from actorId", () => {
    const draft = upgradeLiteToFull(FULL_LITE, "user_abc");
    expect(draft.created_by).toBe("user_abc");
  });
});
