/**
 * BSSoT Upgrade Service
 *
 * Converts Building SSoT Lite (from MVP handoff) into a Building SSoT Full draft.
 *
 * Rules (docs/07-import-from-bssot-lite.md):
 *   - Never invent facts without source data.
 *   - Missing layers = empty objects, not guesses.
 *   - hidden_fields → disclosure_gate.protected_fields.
 *   - source_refs and evidence_refs are preserved verbatim.
 *   - readiness_status starts as lite_imported.
 *   - All unmapped fields go to missing_data classification.
 *
 * Mapping table (doc §6.1):
 *   area_signal            → asset_identity.area_signal
 *   asset_type             → asset_identity.asset_type
 *   price_band             → asset_identity.price_band
 *   size_signal            → physical_fact.size_signal
 *   current_use_signal     → physical_fact.current_use_signal
 *   vacancy_signal         → lease_income.vacancy_summary
 *   fit_summary            → buyer_fit.fit_summary
 *   caution_summary        → risk_unknown.risk_items[0]
 *   hidden_fields          → disclosure_gate.protected_fields
 *   source_refs            → evidence_source.source_refs
 *   evidence_refs          → evidence_source.evidence_refs
 */

// ─── Input Types ─────────────────────────────────────────────────────

export interface SourceRef {
  type: string;
  id: string;
  [key: string]: unknown;
}

export interface EvidenceRef {
  type: string;
  id: string;
  visibility?: string;
  [key: string]: unknown;
}

export interface BSSoTLiteInput {
  id: string;
  area_signal: string | null;
  asset_type: string | null;
  price_band: string | null;
  size_signal: string | null;
  current_use_signal: string | null;
  vacancy_signal: string | null;
  fit_summary: string | null;
  caution_summary: string | null;
  hidden_fields: string[];
  status: string | null;
  disclosure: Record<string, unknown>;
  source_refs: SourceRef[];
  evidence_refs: EvidenceRef[];
  confidence?: string | null;
  [key: string]: unknown;
}

// ─── Output Types ─────────────────────────────────────────────────────

export interface AssetIdentityLayer {
  area_signal: string | null;
  asset_type: string | null;
  price_band: string | null;
  _source: "building_ssot_lite";
}

export interface PhysicalFactLayer {
  size_signal: string | null;
  current_use_signal: string | null;
  _source: "building_ssot_lite";
}

export interface LeaseIncomeLayer {
  vacancy_summary: string | null;
  _source: "building_ssot_lite";
}

export interface BuyerFitLayer {
  fit_summary: string | null;
  _source: "building_ssot_lite";
}

export interface RiskItem {
  description: string;
  source: "caution_summary_lite";
  confidence: string;
}

export interface RiskUnknownLayer {
  risk_items: RiskItem[];
  _source: "building_ssot_lite";
}

export interface DisclosureGateLayer {
  protected_fields: string[];
  visibility_default: "internal_only";
  guard_checked: boolean;
  _source: "building_ssot_lite";
}

export interface NormalizedSourceRef {
  type: string;
  id: string;
  source: "lite_import";
  [key: string]: unknown;
}

export interface EvidenceSourceLayer {
  source_refs: NormalizedSourceRef[];
  evidence_refs: EvidenceRef[];
}

export interface BSSoTFullDraft {
  source_building_ssot_lite_id: string;
  created_by: string;

  // Mapped layers
  asset_identity: AssetIdentityLayer;
  physical_fact: PhysicalFactLayer;
  legal_registry: Record<string, never>;
  lease_income: LeaseIncomeLayer;
  market_location: Record<string, never>;
  value_up_hypothesis: Record<string, never>;
  risk_unknown: RiskUnknownLayer;
  buyer_fit: BuyerFitLayer;
  disclosure_gate: DisclosureGateLayer;
  evidence_source: EvidenceSourceLayer;

  // Empty layers (not invented)
  b2c_consumer_demand: Record<string, never>;
  space_environmental: Record<string, never>;
  tenant_operator_management: Record<string, never>;
  ai_answer_document_contract: Record<string, never>;

  readiness_status: "lite_imported";
}

// ─── Missing Data Types ───────────────────────────────────────────────

export type MissingDataRequiredFor =
  | "required_for_im_lite"
  | "required_for_full_im_draft"
  | "required_for_buyer_ready"
  | "optional_enrichment";

export interface MissingDataItem {
  field: string;
  required_for: MissingDataRequiredFor;
  reason: string;
}

// ─── Core: upgradeLiteToFull ──────────────────────────────────────────

/**
 * Converts BSSoT Lite fields into a BSSoT Full draft.
 * Never invents data. Missing source fields produce null or empty arrays.
 */
export function upgradeLiteToFull(
  lite: BSSoTLiteInput,
  actorId: string,
): BSSoTFullDraft {
  const confidence = lite.confidence ?? "unknown";

  // asset_identity
  const asset_identity: AssetIdentityLayer = {
    area_signal: lite.area_signal ?? null,
    asset_type: lite.asset_type ?? null,
    price_band: lite.price_band ?? null,
    _source: "building_ssot_lite",
  };

  // physical_fact
  const physical_fact: PhysicalFactLayer = {
    size_signal: lite.size_signal ?? null,
    current_use_signal: lite.current_use_signal ?? null,
    _source: "building_ssot_lite",
  };

  // lease_income
  const lease_income: LeaseIncomeLayer = {
    vacancy_summary: lite.vacancy_signal ?? null,
    _source: "building_ssot_lite",
  };

  // buyer_fit
  const buyer_fit: BuyerFitLayer = {
    fit_summary: lite.fit_summary ?? null,
    _source: "building_ssot_lite",
  };

  // risk_unknown (caution_summary → risk_items)
  const risk_items: RiskItem[] = lite.caution_summary
    ? [
        {
          description: lite.caution_summary,
          source: "caution_summary_lite",
          confidence,
        },
      ]
    : [];

  const risk_unknown: RiskUnknownLayer = {
    risk_items,
    _source: "building_ssot_lite",
  };

  // disclosure_gate (hidden_fields → protected_fields)
  const disclosure_gate: DisclosureGateLayer = {
    protected_fields: classifyProtectedFields(lite.hidden_fields ?? []),
    visibility_default: "internal_only",
    guard_checked: Boolean(lite.disclosure?.guard_checked),
    _source: "building_ssot_lite",
  };

  // evidence_source (source_refs + evidence_refs preserved verbatim)
  const evidence_source: EvidenceSourceLayer = {
    source_refs: buildSourceRefs(lite.source_refs ?? []),
    evidence_refs: lite.evidence_refs ?? [],
  };

  return {
    source_building_ssot_lite_id: lite.id,
    created_by: actorId,
    asset_identity,
    physical_fact,
    legal_registry: {},
    lease_income,
    market_location: {},
    value_up_hypothesis: {},
    risk_unknown,
    buyer_fit,
    disclosure_gate,
    evidence_source,
    b2c_consumer_demand: {},
    space_environmental: {},
    tenant_operator_management: {},
    ai_answer_document_contract: {},
    readiness_status: "lite_imported",
  };
}

// ─── classifyProtectedFields ──────────────────────────────────────────

/**
 * Classifies hidden_fields from Lite as protected_fields in Full.
 * Currently a pass-through; future versions may enrich with metadata.
 */
export function classifyProtectedFields(hiddenFields: string[]): string[] {
  return [...hiddenFields];
}

// ─── buildSourceRefs ─────────────────────────────────────────────────

/**
 * Normalizes source_refs from Lite import.
 * Tags each ref with source: "lite_import" for provenance.
 */
export function buildSourceRefs(refs: SourceRef[]): NormalizedSourceRef[] {
  return refs.map((ref) => ({
    ...ref,
    source: "lite_import" as const,
  }));
}

// ─── detectMissingData ────────────────────────────────────────────────

/**
 * Detects missing Full IM data after Lite import (doc §8).
 * Returns classified missing data items. Does not block import.
 */
export function detectMissingData(lite: BSSoTLiteInput): MissingDataItem[] {
  const missing: MissingDataItem[] = [];

  // Disclosure-controlled fields (always "missing" from buyer-ready perspective)
  if (lite.hidden_fields?.includes("exact_address") || !lite.area_signal) {
    missing.push({
      field: "exact_address",
      required_for: "required_for_full_im_draft",
      reason: "Field is protected — requires disclosure gate review before use",
    });
  }

  // Physical fact fields
  if (!lite.size_signal) {
    missing.push({
      field: "gross_floor_area",
      required_for: "required_for_full_im_draft",
      reason: "연면적 데이터가 없습니다",
    });
  }

  // Legal / registry
  missing.push({
    field: "land_area",
    required_for: "required_for_buyer_ready",
    reason: "지목 및 대지면적이 필요합니다",
  });

  missing.push({
    field: "registry",
    required_for: "required_for_full_im_draft",
    reason: "등기부등본이 필요합니다",
  });

  missing.push({
    field: "land_use_plan",
    required_for: "required_for_full_im_draft",
    reason: "토지이용계획 확인서가 필요합니다",
  });

  // Income / lease
  missing.push({
    field: "rent_roll",
    required_for: "required_for_full_im_draft",
    reason: "임대현황표가 필요합니다",
  });

  missing.push({
    field: "lease_summary",
    required_for: "required_for_full_im_draft",
    reason: "임대차 요약 정보가 필요합니다",
  });

  // Physical evidence
  missing.push({
    field: "floor_plan",
    required_for: "required_for_buyer_ready",
    reason: "평면도가 필요합니다",
  });

  missing.push({
    field: "photos",
    required_for: "required_for_buyer_ready",
    reason: "건물 사진이 필요합니다",
  });

  missing.push({
    field: "repair_history",
    required_for: "optional_enrichment",
    reason: "수선이력은 선택사항이나 품질을 높입니다",
  });

  // Financial
  missing.push({
    field: "operating_expenses",
    required_for: "required_for_full_im_draft",
    reason: "운영비용 데이터가 필요합니다",
  });

  // Market
  missing.push({
    field: "market_comps",
    required_for: "required_for_buyer_ready",
    reason: "시장 비교사례가 필요합니다",
  });

  missing.push({
    field: "rent_comps",
    required_for: "required_for_buyer_ready",
    reason: "임대료 비교사례가 필요합니다",
  });

  return missing;
}
