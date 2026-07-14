// src/lib/external/external-data-orchestrator.ts

import { resolveAddress, ResolvedAddress } from "./address-resolver";
import { fetchBuildingRegister, BuildingRegisterData } from "./building-register-api";
import { fetchLandPrice, LandPriceData } from "./land-price-api";
import { fetchLandUsePlan, LandUsePlanData } from "./land-use-api";
import { fetchComparableTransactions, ComparableTransaction } from "./real-transaction-api";
import { fetchLocationPoi, LocationPoiData } from "./kakao-map-api";
import { createServiceClient } from "../supabase/service";

export interface ExternalDataEnrichmentResult {
  resolvedAddress: ResolvedAddress;
  buildingRegister: BuildingRegisterData | null;
  landPrice: LandPriceData | null;
  landUsePlan: LandUsePlanData | null;
  comparableTransactions: ComparableTransaction[];
  locationPoi: LocationPoiData | null;
  enrichedAt: string;
  errors: { api: string; message: string }[];
}

export async function enrichBuildingData(
  rawAddress: string,
  buildingSsotLiteId: string
): Promise<ExternalDataEnrichmentResult | null> {
  const errors: { api: string; message: string }[] = [];

  // 1. 주소 해석
  const resolvedAddress = await resolveAddress(rawAddress);
  if (!resolvedAddress) {
    console.error("Failed to resolve address:", rawAddress);
    return null;
  }

  // 2. 다른 모든 공공데이터/지도 API 병렬 호출
  let buildingRegister: BuildingRegisterData | null = null;
  let landPrice: LandPriceData | null = null;
  let landUsePlan: LandUsePlanData | null = null;
  let comparableTransactions: ComparableTransaction[] = [];
  let locationPoi: LocationPoiData | null = null;

  await Promise.all([
    (async () => {
      try {
        buildingRegister = await fetchBuildingRegister(
          resolvedAddress.sigunguCd,
          resolvedAddress.bjdongCd,
          resolvedAddress.bun,
          resolvedAddress.ji
        );
      } catch (e: any) {
        errors.push({ api: "building-register", message: e.message || "Unknown error" });
      }
    })(),
    (async () => {
      try {
        landPrice = await fetchLandPrice(resolvedAddress.pnu);
      } catch (e: any) {
        errors.push({ api: "land-price", message: e.message || "Unknown error" });
      }
    })(),
    (async () => {
      try {
        landUsePlan = await fetchLandUsePlan(resolvedAddress.pnu);
      } catch (e: any) {
        errors.push({ api: "land-use", message: e.message || "Unknown error" });
      }
    })(),
    (async () => {
      try {
        // 해당 시군구의 최근 거래 내역
        comparableTransactions = await fetchComparableTransactions(resolvedAddress.sigunguCd);
      } catch (e: any) {
        errors.push({ api: "real-transaction", message: e.message || "Unknown error" });
      }
    })(),
    (async () => {
      try {
        locationPoi = await fetchLocationPoi(resolvedAddress.lat, resolvedAddress.lng);
        // resolvedAddress의 위경도를 카카오맵으로 찾은 더 정밀한 지하철 위경도로 갱신
        if (locationPoi && locationPoi.nearestStation) {
          // 필요시 보정
        }
      } catch (e: any) {
        errors.push({ api: "kakao-map-local", message: e.message || "Unknown error" });
      }
    })(),
  ]);

  const enrichmentResult: ExternalDataEnrichmentResult = {
    resolvedAddress,
    buildingRegister,
    landPrice,
    landUsePlan,
    comparableTransactions,
    locationPoi,
    enrichedAt: new Date().toISOString(),
    errors,
  };

  // 3. Supabase 캐시에 저장
  try {
    const supabase = createServiceClient();
    
    // 기존 캐시 존재 여부 확인
    const { data: existing } = await supabase
      .from("external_data_cache")
      .select("id")
      .eq("building_ssot_lite_id", buildingSsotLiteId)
      .maybeSingle();

    const cacheData = {
      building_ssot_lite_id: buildingSsotLiteId,
      pnu: resolvedAddress.pnu,
      legal_dong_code: resolvedAddress.legalDongCode,
      road_address: resolvedAddress.roadAddress,
      jibun_address: resolvedAddress.jibunAddress,
      latitude: resolvedAddress.lat,
      longitude: resolvedAddress.lng,
      building_register: buildingRegister || {},
      building_register_fetched_at: buildingRegister ? new Date().toISOString() : null,
      official_land_price: landPrice || {},
      land_price_fetched_at: landPrice ? new Date().toISOString() : null,
      land_use_plan: landUsePlan || {},
      land_use_fetched_at: landUsePlan ? new Date().toISOString() : null,
      comparable_transactions: comparableTransactions,
      transactions_fetched_at: comparableTransactions.length > 0 ? new Date().toISOString() : null,
      location_poi: locationPoi || {},
      location_fetched_at: locationPoi ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from("external_data_cache")
        .update(cacheData)
        .eq("id", existing.id);
    } else {
      await supabase
        .from("external_data_cache")
        .insert([cacheData]);
    }
  } catch (dbErr) {
    console.error("Failed to write external data cache to database:", dbErr);
  }

  return enrichmentResult;
}
