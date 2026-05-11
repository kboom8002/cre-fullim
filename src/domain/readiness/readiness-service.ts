/**
 * IM Readiness Engine (Slice 4)
 *
 * Pure domain service — no I/O, no Supabase calls.
 * Implements IMReadinessAgent contract from docs/15-ai-agent-contracts.md §4.
 *
 * Rules:
 *   - missing rent_roll always blocks buyer_ready_full_im
 *   - missing operating_expenses blocks income_noi_yield_analysis section
 *   - readiness_score is deterministic (0–100) based on data completeness
 *   - buyer_ready_full_im is NEVER available without gate pass (always blocked here)
 *   - valuation and debt sections always require expert_required=true
 *   - boundary_note must always explain limitations
 */

// ─── Types ────────────────────────────────────────────────────────────

export interface ReadinessInput {
  project_id: string;
  target_output: string;
  building_ssot_full: Record<string, unknown>;
  evidence_refs?: Array<{ type: string; id: string; [key: string]: unknown }>;
}

export interface SectionReadiness {
  section_type: string;
  status: "ready" | "partial" | "blocked";
  missing_data: string[];
  expert_required: boolean;
}

export interface ExpertPatchRecommendation {
  section_type: string;
  expert_role: string;
  patch_type: string;
  reason: string;
  priority: "low" | "medium" | "high";
}

export interface OutputAvailability {
  output: string;
  available: boolean;
  reason: string;
}

export interface ReadinessResult {
  readiness_score: number;
  available_outputs: string[];
  blocked_outputs: string[];
  missing_required_data: string[];
  required_expert_patches: ExpertPatchRecommendation[];
  section_readiness: SectionReadiness[];
  boundary_note: string;
}

// ─── 18 Standard IM Sections (docs/10-domain-model.md §3.4) ──────────

export const IM_SECTIONS_18 = [
  "cover_confidentiality",
  "executive_summary",
  "investment_thesis_buyer_fit",
  "property_fact_sheet",
  "land_zoning_legal_constraints",
  "location_access",
  "micro_market_demand_story",
  "building_condition_physical_review",
  "rent_roll_lease_quality",
  "income_noi_yield_analysis",
  "debt_sensitivity_cash_flow",
  "valuation_logic_comparables",
  "value_add_repositioning_scenario",
  "risk_factors_dd_checklist",
  "deal_process_next_steps",
  "dealroom_qna_starter",
  "appendix_evidence_index",
  "disclaimer_contact",
] as const;

export type IMSectionType = (typeof IM_SECTIONS_18)[number];

// ─── Score weights ────────────────────────────────────────────────────

interface DataPoint {
  key: string;
  points: number;
  check: (bssot: Record<string, unknown>) => boolean;
}

const DATA_POINTS: DataPoint[] = [
  // asset_identity (20pts)
  { key: "area_signal", points: 5, check: (b) => !!layer(b, "asset_identity")?.area_signal },
  { key: "asset_type", points: 5, check: (b) => !!layer(b, "asset_identity")?.asset_type },
  { key: "price_band", points: 5, check: (b) => !!layer(b, "asset_identity")?.price_band },
  { key: "fit_summary", points: 5, check: (b) => !!layer(b, "buyer_fit")?.fit_summary },

  // physical_fact (10pts)
  { key: "size_signal", points: 5, check: (b) => !!layer(b, "physical_fact")?.size_signal },
  { key: "current_use_signal", points: 5, check: (b) => !!layer(b, "physical_fact")?.current_use_signal },

  // legal_registry (15pts)
  { key: "registry", points: 8, check: (b) => !!layer(b, "legal_registry")?.registry_confirmed },
  { key: "land_use_plan", points: 7, check: (b) => !!layer(b, "legal_registry")?.land_use_plan_confirmed },

  // lease_income (25pts) — heaviest weight
  { key: "rent_roll", points: 15, check: (b) => !!layer(b, "lease_income")?.rent_roll_confirmed },
  { key: "lease_summary", points: 5, check: (b) => !!layer(b, "lease_income")?.lease_summary_confirmed },
  { key: "operating_expenses", points: 5, check: (b) => !!layer(b, "lease_income")?.operating_expenses_confirmed },

  // market_location (10pts)
  { key: "location_analysis", points: 10, check: (b) => !!layer(b, "market_location")?.location_analysis },

  // evidence (20pts)
  { key: "evidence_floor_plan", points: 5, check: (b) => hasEvidenceType(b, "floor_plan") },
  { key: "evidence_photo", points: 5, check: (b) => hasEvidenceType(b, "photo") },
  { key: "evidence_registry", points: 5, check: (b) => hasEvidenceType(b, "registry") },
  { key: "evidence_rent_roll", points: 5, check: (b) => hasEvidenceType(b, "rent_roll") },
];

// ─── Helpers ──────────────────────────────────────────────────────────

function layer(bssot: Record<string, unknown>, name: string): Record<string, unknown> {
  return (bssot[name] ?? {}) as Record<string, unknown>;
}

function hasEvidenceType(bssot: Record<string, unknown>, evidenceType: string): boolean {
  const ev = layer(bssot, "evidence_source");
  const refs = (ev.evidence_refs ?? []) as Array<{ type: string }>;
  return refs.some((r) => r.type === evidenceType);
}

// ─── computeReadiness ─────────────────────────────────────────────────

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const bssot = input.building_ssot_full;

  // 1. Score
  let score = 0;
  const missingRequired: string[] = [];

  for (const dp of DATA_POINTS) {
    if (dp.check(bssot)) {
      score += dp.points;
    } else {
      // Track as missing if key is a known blocker
      if (isRequiredKey(dp.key)) {
        missingRequired.push(dp.key);
      }
    }
  }
  score = Math.min(100, score);

  // 2. Block outputs
  const hasRentRoll = !!layer(bssot, "lease_income").rent_roll_confirmed;
  const hasOpex = !!layer(bssot, "lease_income").operating_expenses_confirmed;
  const hasRegistry = !!layer(bssot, "legal_registry").registry_confirmed;

  const blockedOutputs: string[] = [];
  const availableOutputs: string[] = [];

  const allOutputs = ["blind_teaser", "external_snapshot", "im_lite", "full_im_draft", "buyer_ready_full_im", "dealroom_package"];

  for (const output of allOutputs) {
    const blocked = isOutputBlocked(output, { score, hasRentRoll, hasOpex, hasRegistry });
    if (blocked) {
      blockedOutputs.push(output);
    } else {
      availableOutputs.push(output);
    }
  }

  // 3. Section readiness (18 sections)
  const sectionReadiness = buildSectionReadiness(bssot);

  // 4. Expert patches
  const expertPatches = recommendExpertPatches(bssot);

  // 5. Boundary note (always present — docs/17 §3)
  const boundaryNote =
    "본 준비도 평가는 제공된 데이터를 기준으로 한 예비 검토입니다. " +
    "실제 매수자용 출력을 위해서는 임대차계약서·운영비·등기·사진 확인 및 " +
    "전문가 검토와 Gate Review 통과가 필요합니다.";

  return {
    readiness_score: score,
    available_outputs: availableOutputs,
    blocked_outputs: blockedOutputs,
    missing_required_data: missingRequired,
    required_expert_patches: expertPatches,
    section_readiness: sectionReadiness,
    boundary_note: boundaryNote,
  };
}

function isRequiredKey(key: string): boolean {
  return ["rent_roll", "registry", "land_use_plan", "operating_expenses", "size_signal"].includes(key);
}

function isOutputBlocked(
  output: string,
  ctx: { score: number; hasRentRoll: boolean; hasOpex: boolean; hasRegistry: boolean },
): boolean {
  switch (output) {
    case "blind_teaser":
      return ctx.score < 5; // only blocked if absolutely nothing
    case "external_snapshot":
      return ctx.score < 15;
    case "im_lite":
      return ctx.score < 30;
    case "full_im_draft":
      return ctx.score < 50 || !ctx.hasRentRoll;
    case "buyer_ready_full_im":
      // Always blocked — requires gate review pass, never auto-available
      return true;
    case "dealroom_package":
      return true; // always requires expert + gate + evidence index
    default:
      return false;
  }
}

// ─── scoreToAvailability ──────────────────────────────────────────────

export function scoreToAvailability(score: number): OutputAvailability[] {
  const band =
    score <= 30 ? "teaser_only" :
    score <= 50 ? "snapshot_candidate" :
    score <= 70 ? "im_lite_candidate" :
    score <= 85 ? "full_im_draft_candidate" :
    "buyer_ready_candidate";

  return [
    {
      output: "blind_teaser",
      available: score >= 5,
      reason: score >= 5 ? "공개안전 신호 데이터 존재" : "최소 자산 정보가 없습니다",
    },
    {
      output: "external_snapshot",
      available: score >= 31,
      reason: score >= 31 ? "기본 정보 충분" : "기본 정보가 부족합니다 (점수 31 이상 필요)",
    },
    {
      output: "im_lite",
      available: score >= 51,
      reason: score >= 51 ? "핵심 자료 일부 존재" : "IM Lite를 위한 핵심 자료가 부족합니다 (점수 51 이상 필요)",
    },
    {
      output: "full_im_draft",
      available: score >= 71,
      reason: score >= 71 ? "Full IM 초안 작성 가능 수준" : "Full IM Draft를 위한 자료가 부족합니다 (점수 71 이상 필요)",
    },
    {
      output: "buyer_ready_full_im",
      // Never auto-available — buyer_ready requires gate review pass (docs/15 §4 Must Not)
      available: false,
      reason: score >= 86
        ? "점수는 충분하나 Gate Review(gate) 통과 후에만 매수자용 출력이 허용됩니다"
        : "Gate Review(gate) 통과와 전문가 검토가 완료된 후에만 매수자용 출력이 허용됩니다",
    },
  ];
}

// ─── buildSectionReadiness ────────────────────────────────────────────

export function buildSectionReadiness(
  bssot: Record<string, unknown>,
): SectionReadiness[] {
  const leaseIncome = layer(bssot, "lease_income");
  const legalRegistry = layer(bssot, "legal_registry");

  const hasRentRoll = !!leaseIncome.rent_roll_confirmed;
  const hasOpex = !!leaseIncome.operating_expenses_confirmed;
  const hasRegistry = !!legalRegistry.registry_confirmed;
  const hasLandUse = !!legalRegistry.land_use_plan_confirmed;
  const hasLocation = !!layer(bssot, "market_location").location_analysis;
  const hasPhysical = !!layer(bssot, "physical_fact").size_signal;
  const hasAsset = !!layer(bssot, "asset_identity").area_signal;

  const hasFloorPlan = hasEvidenceType(bssot, "floor_plan");
  const hasPhoto = hasEvidenceType(bssot, "photo");

  return IM_SECTIONS_18.map((section_type) => {
    return getSectionReadiness(section_type, {
      hasRentRoll,
      hasOpex,
      hasRegistry,
      hasLandUse,
      hasLocation,
      hasPhysical,
      hasAsset,
      hasFloorPlan,
      hasPhoto,
    });
  });
}

interface SectionCtx {
  hasRentRoll: boolean;
  hasOpex: boolean;
  hasRegistry: boolean;
  hasLandUse: boolean;
  hasLocation: boolean;
  hasPhysical: boolean;
  hasAsset: boolean;
  hasFloorPlan: boolean;
  hasPhoto: boolean;
}

function getSectionReadiness(
  section_type: IMSectionType,
  ctx: SectionCtx,
): SectionReadiness {
  switch (section_type) {
    case "cover_confidentiality":
    case "disclaimer_contact":
      return { section_type, status: "ready", missing_data: [], expert_required: false };

    case "executive_summary":
      return {
        section_type,
        status: ctx.hasAsset ? "partial" : "blocked",
        missing_data: ctx.hasAsset ? [] : ["asset_identity"],
        expert_required: false,
      };

    case "investment_thesis_buyer_fit":
      return {
        section_type,
        status: ctx.hasAsset ? "partial" : "blocked",
        missing_data: ctx.hasAsset ? [] : ["asset_identity", "fit_summary"],
        expert_required: false,
      };

    case "property_fact_sheet":
      return {
        section_type,
        status: ctx.hasPhysical ? "partial" : "blocked",
        missing_data: ctx.hasPhysical ? [] : ["size_signal", "gross_floor_area"],
        expert_required: false,
      };

    case "land_zoning_legal_constraints":
      return {
        section_type,
        status: ctx.hasRegistry && ctx.hasLandUse ? "partial" : "blocked",
        missing_data: [
          ...(!ctx.hasRegistry ? ["registry"] : []),
          ...(!ctx.hasLandUse ? ["land_use_plan"] : []),
        ],
        expert_required: !ctx.hasRegistry,
      };

    case "location_access":
    case "micro_market_demand_story":
      return {
        section_type,
        status: ctx.hasLocation ? "partial" : "blocked",
        missing_data: ctx.hasLocation ? [] : ["location_analysis", "market_comps"],
        expert_required: false,
      };

    case "building_condition_physical_review":
      return {
        section_type,
        status: ctx.hasPhysical && ctx.hasFloorPlan ? "partial" : "blocked",
        missing_data: [
          ...(!ctx.hasPhysical ? ["size_signal"] : []),
          ...(!ctx.hasFloorPlan ? ["floor_plan"] : []),
          ...(!ctx.hasPhoto ? ["photos"] : []),
        ],
        expert_required: true, // always requires architect/building expert
      };

    case "rent_roll_lease_quality":
      return {
        section_type,
        status: ctx.hasRentRoll ? "partial" : "blocked",
        missing_data: ctx.hasRentRoll ? [] : ["rent_roll", "lease_summary"],
        expert_required: !ctx.hasRentRoll,
      };

    case "income_noi_yield_analysis":
      // docs/17 §11: NOI requires rent_roll + operating_expenses + expert review
      if (!ctx.hasRentRoll || !ctx.hasOpex) {
        return {
          section_type,
          status: "blocked",
          missing_data: [
            ...(!ctx.hasRentRoll ? ["rent_roll"] : []),
            ...(!ctx.hasOpex ? ["operating_expenses"] : []),
          ],
          expert_required: true,
        };
      }
      return {
        section_type,
        status: "partial",
        missing_data: [],
        expert_required: true, // always: docs/17 §11
      };

    case "debt_sensitivity_cash_flow":
      // docs/17 §7: debt always requires expert
      return {
        section_type,
        status: ctx.hasRentRoll && ctx.hasOpex ? "partial" : "blocked",
        missing_data: [
          ...(!ctx.hasRentRoll ? ["rent_roll"] : []),
          ...(!ctx.hasOpex ? ["operating_expenses"] : []),
          "debt_assumptions",
        ],
        expert_required: true, // always
      };

    case "valuation_logic_comparables":
      // docs/17 §8: valuation always requires expert
      return {
        section_type,
        status: "partial",
        missing_data: ["market_comps", "rent_comps"],
        expert_required: true, // always
      };

    case "value_add_repositioning_scenario":
      return {
        section_type,
        status: "partial",
        missing_data: ["value_add_evidence"],
        expert_required: true,
      };

    case "risk_factors_dd_checklist":
      return {
        section_type,
        status: "partial",
        missing_data: [],
        expert_required: true,
      };

    case "deal_process_next_steps":
    case "dealroom_qna_starter":
    case "appendix_evidence_index":
      return {
        section_type,
        status: "partial",
        missing_data: [],
        expert_required: false,
      };

    default:
      return {
        section_type,
        status: "partial",
        missing_data: [],
        expert_required: false,
      };
  }
}

// ─── recommendExpertPatches ───────────────────────────────────────────

export function recommendExpertPatches(
  bssot: Record<string, unknown>,
): ExpertPatchRecommendation[] {
  const patches: ExpertPatchRecommendation[] = [];
  const leaseIncome = layer(bssot, "lease_income");
  const legalRegistry = layer(bssot, "legal_registry");

  const hasRentRoll = !!leaseIncome.rent_roll_confirmed;
  const hasOpex = !!leaseIncome.operating_expenses_confirmed;
  const hasRegistry = !!legalRegistry.registry_confirmed;

  // Missing rent_roll → cre_consultant for rent_roll section
  if (!hasRentRoll) {
    patches.push({
      section_type: "rent_roll_lease_quality",
      expert_role: "cre_consultant",
      patch_type: "data_review",
      reason: "임대차 현황표(임대료, 임차인 구성, 만기 현황)가 없어 임대 품질 분석이 불가합니다",
      priority: "high",
    });
  }

  // Missing operating_expenses → cre_consultant for NOI section (docs/17 §11)
  if (!hasOpex) {
    patches.push({
      section_type: "income_noi_yield_analysis",
      expert_role: "cre_consultant",
      patch_type: "financial_review",
      reason: "운영비 데이터가 없어 NOI 및 수익률 분석이 제한됩니다. 운영비 가정 검토 및 표현 수정이 필요합니다",
      priority: "high",
    });
  }

  // Missing registry → legal_expert
  if (!hasRegistry) {
    patches.push({
      section_type: "land_zoning_legal_constraints",
      expert_role: "legal_expert",
      patch_type: "legal_review",
      reason: "등기부등본 및 토지이용계획 확인이 되지 않아 법적 제약 섹션 작성이 어렵습니다",
      priority: "high",
    });
  }

  // Valuation — always recommended (docs/17 §8)
  patches.push({
    section_type: "valuation_logic_comparables",
    expert_role: "valuation_expert",
    patch_type: "valuation_review",
    reason: "가치평가 섹션은 반드시 감정평가 전문가 검토가 필요합니다",
    priority: "medium",
  });

  // Debt — always recommended (docs/17 §7)
  patches.push({
    section_type: "debt_sensitivity_cash_flow",
    expert_role: "debt_financing_expert",
    patch_type: "financial_review",
    reason: "대출 민감도 분석은 금융 전문가 검토 및 면책 문구 확인이 필요합니다",
    priority: "medium",
  });

  return patches;
}
