/**
 * IM Section Planner (Slice 5)
 *
 * Generates the 18-section Full IM outline plan.
 * Pure domain service — no I/O.
 *
 * Implements:
 *   - docs/15-ai-agent-contracts.md §6 IMSectionPlannerAgent output schema
 *   - docs/10-domain-model.md §3.4 required 18 sections
 *   - docs/12-api-contracts.md §6.1 Generate Outline
 *   - docs/24-section-editor-spec.md §9 Section-specific Templates
 *
 * Key rules:
 *   - Exactly 18 sections, sequential order 1–18
 *   - No duplicate section_type
 *   - Status derived from readiness_result
 *   - debt + valuation always need expert_patch (docs/17)
 *   - mergeSectionUpdates is idempotent (dedup by section_type)
 */

import type { ReadinessResult } from "@/domain/readiness/readiness-service";
import { IM_SECTIONS_18, type IMSectionType } from "@/domain/readiness/readiness-service";

// ─── Types ────────────────────────────────────────────────────────────

export type SectionStatus =
  | "planned"
  | "needs_data"
  | "needs_expert_patch"
  | "blocked";

export type SectionConfidence =
  | "confirmed"
  | "inferred"
  | "needs_evidence"
  | "expert_required"
  | "unknown";

export type SectionRiskLevel = "low" | "medium" | "high" | "blocked";

export interface SectionPlan {
  section_type: IMSectionType;
  section_order: number;
  title: string;
  status: SectionStatus;
  confidence: SectionConfidence;
  risk_level: SectionRiskLevel;
  requires_expert_patch: boolean;
  required_expert_roles: string[];
  missing_data: string[];
  required_evidence: string[];
}

export interface SectionPlanInput {
  project_id: string;
  target_output: string;
  building_ssot_full: Record<string, unknown>;
  readiness_result: ReadinessResult;
}

export interface SectionTemplate {
  title: string;
  structure: string;
  risk_level: SectionRiskLevel;
  always_expert: boolean;
  expert_roles: string[];
  required_evidence: string[];
}

// ─── 18-section definitions ───────────────────────────────────────────

export const IM_SECTION_DEFINITIONS: Record<IMSectionType, SectionTemplate> = {
  cover_confidentiality: {
    title: "표지 및 기밀유지 안내",
    structure: "표지 / 기밀유지 조항 / 배포 제한 안내",
    risk_level: "low",
    always_expert: false,
    expert_roles: [],
    required_evidence: [],
  },
  executive_summary: {
    title: "핵심 요약",
    structure: "자산 개요 / 투자 포인트 / 주요 수치 요약 / 매수 추천 대상",
    risk_level: "medium",
    always_expert: false,
    expert_roles: [],
    required_evidence: [],
  },
  investment_thesis_buyer_fit: {
    title: "투자 논거 및 매수자 적합성",
    structure: "투자 논거 / 매수 유형별 적합성 / 기대 시나리오",
    risk_level: "medium",
    always_expert: false,
    expert_roles: [],
    required_evidence: [],
  },
  property_fact_sheet: {
    title: "물건 기본 팩트 시트",
    structure: "자산 유형 / 연면적 / 대지면적 / 건축연도 / 용도 / 위치 신호",
    risk_level: "low",
    always_expert: false,
    expert_roles: [],
    required_evidence: ["floor_plan", "photo"],
  },
  land_zoning_legal_constraints: {
    title: "토지·용도지역·법적 제약",
    structure: "용도지역 / 건폐율·용적률 / 개발제한 / 등기 현황",
    risk_level: "high",
    always_expert: true,
    expert_roles: ["legal_expert"],
    required_evidence: ["registry", "land_use_plan"],
  },
  location_access: {
    title: "입지 및 접근성",
    structure: "광역 입지 / 역세권 분석 / 도보 접근성 / 주변 인프라",
    risk_level: "low",
    always_expert: false,
    expert_roles: [],
    required_evidence: [],
  },
  micro_market_demand_story: {
    title: "미시 시장 및 수요 스토리",
    structure: "상권 특성 / 임차 수요층 / 공실 동향 / 수요 성장 가설",
    risk_level: "medium",
    always_expert: false,
    expert_roles: ["market_research_expert"],
    required_evidence: [],
  },
  building_condition_physical_review: {
    title: "건물 상태 및 물리적 검토",
    structure: "외관·내부 상태 / 주요 설비 / 수선 이력 / 잔여 유효수명",
    risk_level: "medium",
    always_expert: true,
    expert_roles: ["architect_building_expert"],
    required_evidence: ["floor_plan", "photo", "repair_history"],
  },
  rent_roll_lease_quality: {
    title: "임대 현황 및 임대차 품질",
    structure: "임차인 구성 / 임대료 구조 / 만기 집중도 / 공실 현황",
    risk_level: "high",
    always_expert: false,
    expert_roles: ["cre_consultant"],
    required_evidence: ["rent_roll", "lease_summary"],
  },
  income_noi_yield_analysis: {
    title: "임대수입·NOI·수익률 분석",
    structure:
      "1. 입력 근거 / 2. 현재 수입 요약 / 3. 가정 / 4. NOI 추정 / 5. 수익률 민감도 / 6. 누락 데이터 / 7. 주의 사항",
    risk_level: "high",
    always_expert: true,
    expert_roles: ["cre_consultant"],
    required_evidence: ["rent_roll"],
  },
  debt_sensitivity_cash_flow: {
    title: "대출 민감도 및 현금흐름",
    structure: "대출 가정 시나리오 / DSCR 예비 검토 / 현금흐름 민감도 / 면책 사항",
    risk_level: "high",
    always_expert: true,
    expert_roles: ["debt_financing_expert"],
    required_evidence: [],
  },
  valuation_logic_comparables: {
    title: "가치평가 논리 및 비교사례",
    structure: "비교 기준 / 면적당 가격 비교 / Cap Rate 비교 / 보정 요인 / 평가 한계",
    risk_level: "high",
    always_expert: true,
    expert_roles: ["valuation_expert"],
    required_evidence: ["market_comp"],
  },
  value_add_repositioning_scenario: {
    title: "가치상승·리포지셔닝 시나리오",
    structure: "아이디어 / 전제 조건 / 비용·공실·기간 리스크 / 필요 검증",
    risk_level: "high",
    always_expert: true,
    expert_roles: ["cre_consultant"],
    required_evidence: [],
  },
  risk_factors_dd_checklist: {
    title: "리스크 요인 및 DD 체크리스트",
    structure: "Risk / 잠재 영향 / 필요 증거 / 오너·중개 확인 필요 / 전문가 검토 / 상태",
    risk_level: "high",
    always_expert: true,
    expert_roles: ["cre_consultant", "legal_expert"],
    required_evidence: [],
  },
  deal_process_next_steps: {
    title: "딜 프로세스 및 다음 단계",
    structure: "매각 프로세스 / 우선협상 조건 / NDA / 다음 단계 로드맵",
    risk_level: "medium",
    always_expert: false,
    expert_roles: [],
    required_evidence: [],
  },
  dealroom_qna_starter: {
    title: "딜룸 Q&A 스타터",
    structure: "예상 질문 목록 / 답변 준비 상태 / 추가 증거 필요 항목",
    risk_level: "medium",
    always_expert: false,
    expert_roles: [],
    required_evidence: [],
  },
  appendix_evidence_index: {
    title: "부록: 증거 자료 인덱스",
    structure: "증거 제목 / 유형 / 검토 상태 / 열람 가능 여부 / 연관 섹션",
    risk_level: "low",
    always_expert: false,
    expert_roles: [],
    required_evidence: [],
  },
  disclaimer_contact: {
    title: "면책 사항 및 연락처",
    structure: "법적 면책 문구 / 연락처 / 배포 제한 재확인",
    risk_level: "low",
    always_expert: false,
    expert_roles: [],
    required_evidence: [],
  },
};

// ─── Helper ───────────────────────────────────────────────────────────

function layer(bssot: Record<string, unknown>, name: string): Record<string, unknown> {
  return (bssot[name] ?? {}) as Record<string, unknown>;
}

// ─── planSections ─────────────────────────────────────────────────────

export function planSections(input: SectionPlanInput): SectionPlan[] {
  const bssot = input.building_ssot_full;
  const missing = new Set(input.readiness_result.missing_required_data);

  const leaseIncome = layer(bssot, "lease_income");
  const legalRegistry = layer(bssot, "legal_registry");
  const assetIdentity = layer(bssot, "asset_identity");
  const physicalFact = layer(bssot, "physical_fact");

  const hasRentRoll = !!leaseIncome.rent_roll_confirmed;
  const hasOpex = !!leaseIncome.operating_expenses_confirmed;
  const hasRegistry = !!legalRegistry.registry_confirmed;
  const hasLandUse = !!legalRegistry.land_use_plan_confirmed;
  const hasAsset = !!assetIdentity.area_signal;
  const hasPhysical = !!physicalFact.size_signal;
  const hasLocation = !!layer(bssot, "market_location").location_analysis;

  return IM_SECTIONS_18.map((section_type, idx): SectionPlan => {
    const def = IM_SECTION_DEFINITIONS[section_type];
    const order = idx + 1;

    const { status, confidence, sectionMissing } = deriveSectionStatus(section_type, {
      missing,
      hasRentRoll,
      hasOpex,
      hasRegistry,
      hasLandUse,
      hasAsset,
      hasPhysical,
      hasLocation,
      alwaysExpert: def.always_expert,
    });

    return {
      section_type,
      section_order: order,
      title: def.title,
      status,
      confidence,
      risk_level: def.risk_level,
      requires_expert_patch: def.always_expert || sectionMissing.length > 0 && def.expert_roles.length > 0,
      required_expert_roles: def.expert_roles,
      missing_data: sectionMissing,
      required_evidence: def.required_evidence,
    };
  });
}

interface SectionCtx {
  missing: Set<string>;
  hasRentRoll: boolean;
  hasOpex: boolean;
  hasRegistry: boolean;
  hasLandUse: boolean;
  hasAsset: boolean;
  hasPhysical: boolean;
  hasLocation: boolean;
  alwaysExpert: boolean;
}

function deriveSectionStatus(
  section_type: IMSectionType,
  ctx: SectionCtx,
): { status: SectionStatus; confidence: SectionConfidence; sectionMissing: string[] } {
  // Sections always available
  if (
    section_type === "cover_confidentiality" ||
    section_type === "disclaimer_contact" ||
    section_type === "appendix_evidence_index" ||
    section_type === "deal_process_next_steps" ||
    section_type === "dealroom_qna_starter"
  ) {
    return { status: "planned", confidence: "confirmed", sectionMissing: [] };
  }

  // Debt + Valuation always need expert (docs/17)
  if (section_type === "debt_sensitivity_cash_flow") {
    const miss = [...(!ctx.hasRentRoll ? ["rent_roll"] : []), ...(!ctx.hasOpex ? ["operating_expenses"] : [])];
    return { status: "needs_expert_patch", confidence: "expert_required", sectionMissing: miss };
  }
  if (section_type === "valuation_logic_comparables") {
    return { status: "needs_expert_patch", confidence: "expert_required", sectionMissing: ["market_comps", "rent_comps"] };
  }

  // Income / NOI
  if (section_type === "income_noi_yield_analysis") {
    if (!ctx.hasRentRoll || !ctx.hasOpex) {
      return {
        status: "needs_data",
        confidence: "needs_evidence",
        sectionMissing: [...(!ctx.hasRentRoll ? ["rent_roll"] : []), ...(!ctx.hasOpex ? ["operating_expenses"] : [])],
      };
    }
    return { status: "needs_expert_patch", confidence: "expert_required", sectionMissing: [] };
  }

  // Rent roll
  if (section_type === "rent_roll_lease_quality") {
    if (!ctx.hasRentRoll) {
      return { status: "needs_data", confidence: "needs_evidence", sectionMissing: ["rent_roll", "lease_summary"] };
    }
    return { status: "planned", confidence: "inferred", sectionMissing: [] };
  }

  // Legal
  if (section_type === "land_zoning_legal_constraints") {
    if (!ctx.hasRegistry || !ctx.hasLandUse) {
      return {
        status: "needs_data",
        confidence: "needs_evidence",
        sectionMissing: [...(!ctx.hasRegistry ? ["registry"] : []), ...(!ctx.hasLandUse ? ["land_use_plan"] : [])],
      };
    }
    return { status: "needs_expert_patch", confidence: "expert_required", sectionMissing: [] };
  }

  // Physical / Building condition
  if (section_type === "building_condition_physical_review") {
    if (!ctx.hasPhysical) {
      return { status: "needs_data", confidence: "needs_evidence", sectionMissing: ["size_signal", "floor_plan"] };
    }
    return { status: "needs_expert_patch", confidence: "expert_required", sectionMissing: [] };
  }

  // Property fact sheet
  if (section_type === "property_fact_sheet") {
    if (!ctx.hasPhysical) return { status: "needs_data", confidence: "needs_evidence", sectionMissing: ["size_signal"] };
    return { status: "planned", confidence: "inferred", sectionMissing: [] };
  }

  // Location / market
  if (section_type === "location_access" || section_type === "micro_market_demand_story") {
    if (!ctx.hasLocation) return { status: "needs_data", confidence: "needs_evidence", sectionMissing: ["location_analysis"] };
    return { status: "planned", confidence: "inferred", sectionMissing: [] };
  }

  // Always expert sections
  if (ctx.alwaysExpert) {
    return { status: "needs_expert_patch", confidence: "expert_required", sectionMissing: [] };
  }

  // Default
  return { status: "planned", confidence: "inferred", sectionMissing: [] };
}

// ─── mergeSectionUpdates — idempotent dedup ───────────────────────────

/**
 * Merges a new plan into existing sections.
 * Deduplicates by section_type — existing rows are preserved.
 * On re-run, does not create duplicates.
 */
export function mergeSectionUpdates(
  existing: SectionPlan[],
  incoming: SectionPlan[],
): SectionPlan[] {
  const byType = new Map<string, SectionPlan>();
  // Existing take precedence
  for (const s of existing) byType.set(s.section_type, s);
  // Incoming fills gaps only
  for (const s of incoming) {
    if (!byType.has(s.section_type)) byType.set(s.section_type, s);
  }
  // Return in canonical order
  return IM_SECTIONS_18.map((t) => byType.get(t)!).filter(Boolean);
}

// ─── getSectionTemplate ───────────────────────────────────────────────

export function getSectionTemplate(sectionType: string): SectionTemplate | undefined {
  return IM_SECTION_DEFINITIONS[sectionType as IMSectionType];
}
