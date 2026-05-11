import { type MobileIMSupplementalInput } from "./mobile-im-types";

// Mobile IM 생성 최소 요구: 40점 (Full IM: 71점)
export const MOBILE_IM_READINESS_THRESHOLD = 40;

export const MOBILE_IM_DATA_POINTS = [
  { key: "area_signal",     points: 15, label: "권역 정보" },
  { key: "price_band",      points: 15, label: "가격대" },
  { key: "asset_type",      points: 15, label: "자산 유형" },
  { key: "monthly_rent",    points: 20, label: "월세 총액" },
  { key: "vacancy",         points: 10, label: "공실 현황" },
  { key: "photos",          points: 15, label: "건물 사진" },
  { key: "location",        points: 10, label: "상세 위치/입지" },
];

export function computeMobileIMReadiness(
  bssotLite: Record<string, unknown>,
  supplemental: MobileIMSupplementalInput
): { score: number; can_generate: boolean; missing: string[] } {
  let score = 0;
  const missing: string[] = [];

  const assetIdentity = (bssotLite.asset_identity ?? {}) as Record<string, unknown>;
  const marketLocation = (bssotLite.market_location ?? {}) as Record<string, unknown>;

  // Check area_signal
  if (assetIdentity.area_signal) score += 15;
  else missing.push("권역 정보");

  // Check price_band
  if (assetIdentity.price_band) score += 15;
  else missing.push("가격대");

  // Check asset_type
  if (assetIdentity.asset_type) score += 15;
  else missing.push("자산 유형");

  // Check monthly_rent (Supplemental)
  if (supplemental.monthly_rent_total_krw && supplemental.monthly_rent_total_krw > 0) score += 20;
  else missing.push("월세 총액");

  // Check vacancy (Supplemental or BSSoT Lite)
  const physicalFact = (bssotLite.physical_fact ?? {}) as Record<string, unknown>;
  if (supplemental.vacancy_status || physicalFact.vacancy_signal) score += 10;
  else missing.push("공실 현황");

  // Check photos (Supplemental)
  if (supplemental.photo_urls && supplemental.photo_urls.length > 0) score += 15;
  else missing.push("건물 사진");

  // Check location
  if (marketLocation.location_analysis || bssotLite.address) score += 10;
  else missing.push("상세 위치/입지");

  score = Math.min(score, 100);

  return {
    score,
    can_generate: score >= MOBILE_IM_READINESS_THRESHOLD,
    missing,
  };
}
