// src/domain/mobile-im/market-intelligence.ts

import { createServiceClient } from "../../lib/supabase/service";

export interface MarketIntelligence {
  period: string;
  regionInterest: Record<string, number>;       // 권역별 관심 지수
  assetTypeDemand: Record<string, number>;      // 자산 유형별 수요 분산
  yieldBandDemand: Record<string, number>;      // 희망 수익률 구간별 수요 분산
  avgViewsPerIM: number;
  avgShareRate: number;
  avgInterestConversion: number;
}

/**
 * 플렛폼 전반의 누적 행동 빅데이터를 기계적으로 통계화하여 시장 인텔리전스 레포트를 산출합니다.
 */
export async function computeMarketIntelligence(
  period: { from: string; to: string }
): Promise<MarketIntelligence> {
  const supabase = createServiceClient();

  // 1. Fetch all project view logs and interests
  const { data: allLogs } = await supabase
    .from("mobile_im_view_logs")
    .select("*, mobile_im_projects(title, key_metrics)")
    .gte("created_at", period.from)
    .lte("created_at", period.to);

  const { data: allProjects } = await supabase
    .from("mobile_im_projects")
    .select("id, title, key_metrics");

  const activeLogs = allLogs || [];
  const projects = allProjects || [];

  const regionInterest: Record<string, number> = {};
  const assetTypeDemand: Record<string, number> = {};
  const yieldBandDemand: Record<string, number> = {
    "3.0% 미만": 0,
    "3.0% - 4.0%": 0,
    "4.0% - 5.0%": 0,
    "5.0% 이상": 0,
  };

  // Compile heatmaps based on page hits
  activeLogs.forEach((log: any) => {
    const proj = log.mobile_im_projects;
    if (!proj) return;

    // A. Region mapping
    const region = proj.key_metrics?.area_signal || "기타 핵심권역";
    regionInterest[region] = (regionInterest[region] || 0) + 1;

    // B. Asset type mapping
    const type = proj.key_metrics?.asset_type || "상업용 꼬마빌딩";
    assetTypeDemand[type] = (assetTypeDemand[type] || 0) + 1;

    // C. Yield band mapping
    const yieldPct = parseFloat(proj.key_metrics?.estimated_yield_pct || "0");
    if (yieldPct > 0) {
      if (yieldPct < 3.0) yieldBandDemand["3.0% 미만"]++;
      else if (yieldPct < 4.0) yieldBandDemand["3.0% - 4.0%"]++;
      else if (yieldPct < 5.0) yieldBandDemand["4.0% - 5.0%"]++;
      else yieldBandDemand["5.0% 이상"]++;
    }
  });

  // Funnel calculations
  const totalViews = activeLogs.length;
  const projectCount = Math.max(1, projects.length);
  const avgViewsPerIM = Math.round(totalViews / projectCount);

  let totalShares = 0;
  let totalInterests = 0;
  activeLogs.forEach((l: any) => {
    if (l.event_type === "share" || l.section_viewed === "kakao_share") totalShares++;
    if (l.event_type === "gate_pass" && l.section_viewed === "G1") totalInterests++;
  });

  const avgShareRate = totalViews > 0 ? parseFloat(((totalShares / totalViews) * 100).toFixed(1)) : 0;
  const avgInterestConversion = totalViews > 0 ? parseFloat(((totalInterests / totalViews) * 100).toFixed(1)) : 0;

  return {
    period: `${period.from} ~ ${period.to}`,
    regionInterest,
    assetTypeDemand,
    yieldBandDemand,
    avgViewsPerIM,
    avgShareRate,
    avgInterestConversion,
  };
}
