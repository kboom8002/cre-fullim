// src/domain/mobile-im/data-provenance.ts

import { ExternalDataEnrichmentResult } from "../../lib/external/external-data-orchestrator";
import { MobileIMSupplementalInput } from "./mobile-im-types";

export type ProvenanceSource = "public_data" | "broker_input" | "ai_inferred" | "expert_verified";
export type ConfidenceLevel = "confirmed" | "inferred" | "needs_check";

export interface DataPointProvenance {
  fieldKey: string;               // 'total_area', 'official_land_price' 등
  value: string | number;
  source: ProvenanceSource;
  sourceDetail: string;           // "건축물대장 API (2026-05-25 조회)"
  confidence: ConfidenceLevel;
  lastVerifiedAt: string;
}

/**
 * BSSoT Lite + 외부 보강 데이터 + 브로커 수동 입력을 통합하여 데이터 포인트 출처 맵 생성
 */
export function buildProvenanceMap(
  bssotLite: Record<string, any>,
  externalData: ExternalDataEnrichmentResult | null,
  supplemental: MobileIMSupplementalInput
): DataPointProvenance[] {
  const provenanceMap: DataPointProvenance[] = [];
  const nowStr = new Date().toISOString();

  // 1. 연면적 (total_area)
  if (externalData?.buildingRegister?.totalArea) {
    provenanceMap.push({
      fieldKey: "total_area",
      value: externalData.buildingRegister.totalArea,
      source: "public_data",
      sourceDetail: "정부 정부 24 건축물대장 API",
      confidence: "confirmed",
      lastVerifiedAt: externalData.enrichedAt,
    });
  } else if (bssotLite.total_area) {
    provenanceMap.push({
      fieldKey: "total_area",
      value: Number(bssotLite.total_area),
      source: "broker_input",
      sourceDetail: "브로커 직접 등록 정보 (SSoT)",
      confidence: "inferred",
      lastVerifiedAt: nowStr,
    });
  }

  // 2. 대지면적 (plat_area)
  if (externalData?.buildingRegister?.platArea) {
    provenanceMap.push({
      fieldKey: "plat_area",
      value: externalData.buildingRegister.platArea,
      source: "public_data",
      sourceDetail: "정부 정부 24 건축물대장 API",
      confidence: "confirmed",
      lastVerifiedAt: externalData.enrichedAt,
    });
  } else if (bssotLite.plat_area) {
    provenanceMap.push({
      fieldKey: "plat_area",
      value: Number(bssotLite.plat_area),
      source: "broker_input",
      sourceDetail: "브로커 직접 등록 정보 (SSoT)",
      confidence: "inferred",
      lastVerifiedAt: nowStr,
    });
  }

  // 3. 사용승인일 (use_approval_date)
  if (externalData?.buildingRegister?.useAprDay) {
    provenanceMap.push({
      fieldKey: "use_approval_date",
      value: externalData.buildingRegister.useAprDay,
      source: "public_data",
      sourceDetail: "정부 정부 24 건축물대장 API",
      confidence: "confirmed",
      lastVerifiedAt: externalData.enrichedAt,
    });
  } else if (bssotLite.use_approval_date) {
    provenanceMap.push({
      fieldKey: "use_approval_date",
      value: String(bssotLite.use_approval_date),
      source: "broker_input",
      sourceDetail: "브로커 직접 등록 정보 (SSoT)",
      confidence: "inferred",
      lastVerifiedAt: nowStr,
    });
  }

  // 4. 용도지역 (zoning)
  if (externalData?.landUsePlan?.zoningDistrict) {
    provenanceMap.push({
      fieldKey: "zoning",
      value: externalData.landUsePlan.zoningDistrict,
      source: "public_data",
      sourceDetail: "토지이용규제정보서비스(LURIS) API",
      confidence: "confirmed",
      lastVerifiedAt: externalData.enrichedAt,
    });
  }

  // 5. 개별공시지가 (official_land_price)
  if (externalData?.landPrice?.pricePerSqm) {
    provenanceMap.push({
      fieldKey: "official_land_price",
      value: externalData.landPrice.pricePerSqm,
      source: "public_data",
      sourceDetail: "국토교통부 개별공시지가 API (2025)",
      confidence: "confirmed",
      lastVerifiedAt: externalData.enrichedAt,
    });
  }

  // 6. 월임대료 총액 (monthly_rent_total)
  if (supplemental.monthly_rent_total_krw) {
    provenanceMap.push({
      fieldKey: "monthly_rent_total",
      value: supplemental.monthly_rent_total_krw,
      source: "broker_input",
      sourceDetail: "브로커 제공 실제 임대 정보",
      confidence: "confirmed",
      lastVerifiedAt: nowStr,
    });
  } else if (bssotLite.monthly_rent_total) {
    provenanceMap.push({
      fieldKey: "monthly_rent_total",
      value: Number(bssotLite.monthly_rent_total),
      source: "broker_input",
      sourceDetail: "브로커 직접 등록 정보 (SSoT)",
      confidence: "inferred",
      lastVerifiedAt: nowStr,
    });
  }

  // 7. 공실률 (vacancy_rate)
  if (supplemental.vacancy_status) {
    provenanceMap.push({
      fieldKey: "vacancy_rate",
      value: supplemental.vacancy_status,
      source: "broker_input",
      sourceDetail: "브로커 제공 실시간 수치",
      confidence: "confirmed",
      lastVerifiedAt: nowStr,
    });
  } else {
    provenanceMap.push({
      fieldKey: "vacancy_rate",
      value: "정보 없음",
      source: "ai_inferred",
      sourceDetail: "기본값 추론 (통상 공실률)",
      confidence: "needs_check",
      lastVerifiedAt: nowStr,
    });
  }

  // 8. 예상 수익률 (estimated_yield)
  if (supplemental.estimated_yield_pct) {
    provenanceMap.push({
      fieldKey: "estimated_yield",
      value: supplemental.estimated_yield_pct,
      source: "broker_input",
      sourceDetail: "브로커 제시 목표 수익률",
      confidence: "confirmed",
      lastVerifiedAt: nowStr,
    });
  } else if (bssotLite.estimated_yield) {
    provenanceMap.push({
      fieldKey: "estimated_yield",
      value: Number(bssotLite.estimated_yield),
      source: "broker_input",
      sourceDetail: "브로커 직접 등록 정보 (SSoT)",
      confidence: "confirmed",
      lastVerifiedAt: nowStr,
    });
  } else {
    // 임대료와 매매가격 기반 AI 추정 계산
    const purchasePrice = Number(bssotLite.purchase_price || bssotLite.deal_amount || 0);
    const monthlyRent = Number(supplemental.monthly_rent_total_krw || bssotLite.monthly_rent_total || 0);
    if (purchasePrice > 0 && monthlyRent > 0) {
      const computedYield = ((monthlyRent * 12) / purchasePrice) * 100;
      provenanceMap.push({
        fieldKey: "estimated_yield",
        value: parseFloat(computedYield.toFixed(2)),
        source: "ai_inferred",
        sourceDetail: "월세/매매가 기반 계산 수치",
        confidence: "inferred",
        lastVerifiedAt: nowStr,
      });
    }
  }

  return provenanceMap;
}

/**
 * 출처 배지 시각화 정보 포맷팅
 */
export function formatProvenanceBadge(provenance: DataPointProvenance): {
  icon: string;
  label: string;
  color: string;
} {
  switch (provenance.source) {
    case "public_data":
      return { icon: "✓", label: "공공데이터", color: "emerald" };
    case "expert_verified":
      return { icon: "★", label: "전문가 검증", color: "blue" };
    case "broker_input":
      return { icon: "👤", label: "브로커 등록", color: "amber" };
    case "ai_inferred":
    default:
      if (provenance.confidence === "needs_check") {
        return { icon: "⚠", label: "확인 필요", color: "red" };
      }
      return { icon: "⚙", label: "AI 계산", color: "indigo" };
  }
}
