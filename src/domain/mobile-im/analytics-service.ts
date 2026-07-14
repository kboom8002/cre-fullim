// src/domain/mobile-im/analytics-service.ts

import { createServiceClient } from "../../lib/supabase/service";

export interface ViewAnalyticsSummary {
  totalViews: number;
  uniqueViewers: number;
  kakaoShares: number;
  fullImRequests: number;
  interestCount: number;
  sectionDwellAvg: Record<string, number>;      // 섹션별 평균 체류 시간 (초)
  topSection: string;
  bottomSection: string;
  deviceBreakdown: Record<string, number>;       // mobile/tablet/desktop
}

/**
 * 모바일 IM 프로젝트의 모든 열람 로그 및 관심 표명을 집계하여 대시보드 요약을 생성합니다.
 */
export async function computeViewAnalytics(
  mobileImProjectId: string
): Promise<ViewAnalyticsSummary> {
  const supabase = createServiceClient();

  // 1. Fetch view logs
  const { data: logs, error: logsErr } = await supabase
    .from("mobile_im_view_logs")
    .select("*")
    .eq("mobile_im_project_id", mobileImProjectId);

  if (logsErr) {
    console.error("Failed to query view logs for analytics:", logsErr);
  }

  // 2. Fetch interests count
  const { count: interestCount, error: interestErr } = await supabase
    .from("mobile_im_interests")
    .select("id", { count: "exact", head: true })
    .eq("mobile_im_project_id", mobileImProjectId);

  if (interestErr) {
    console.error("Failed to count interests for analytics:", interestErr);
  }

  const activeLogs = logs || [];
  const totalViews = activeLogs.length;

  // Aggregate unique sessions
  const sessions = new Set(activeLogs.map(l => l.session_id));
  const uniqueViewers = sessions.size;

  // Aggregate shares and upgrade requests
  let kakaoShares = 0;
  let fullImRequests = 0;
  activeLogs.forEach(l => {
    if (l.event_type === "share" || l.section_viewed === "kakao_share") {
      kakaoShares++;
    }
    if (l.event_type === "full_im_request" || l.section_viewed === "full_im_upgrade") {
      fullImRequests++;
    }
  });

  // Calculate section dwell times
  const sectionDwellTotals: Record<string, number> = {};
  const sectionCounts: Record<string, number> = {};

  activeLogs.forEach(l => {
    if (l.event_type === "section_dwell" && l.section_viewed) {
      const sec = l.section_viewed;
      const secDwell = l.dwell_time_seconds || 0;
      sectionDwellTotals[sec] = (sectionDwellTotals[sec] || 0) + secDwell;
      sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
    }
  });

  const sectionDwellAvg: Record<string, number> = {};
  let topSection = "N/A";
  let bottomSection = "N/A";
  let maxDwell = -1;
  let minDwell = 999999;

  Object.keys(sectionCounts).forEach(sec => {
    const avg = Math.round(sectionDwellTotals[sec] / sectionCounts[sec]);
    sectionDwellAvg[sec] = avg;

    if (avg > maxDwell) {
      maxDwell = avg;
      topSection = sec;
    }
    if (avg < minDwell) {
      minDwell = avg;
      bottomSection = sec;
    }
  });

  // Calculate device breakdown
  const deviceBreakdown: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
  activeLogs.forEach(l => {
    const dev = l.device_type || "mobile";
    if (dev.includes("mobile")) deviceBreakdown.mobile++;
    else if (dev.includes("tablet")) deviceBreakdown.tablet++;
    else deviceBreakdown.desktop++;
  });

  return {
    totalViews,
    uniqueViewers,
    kakaoShares,
    fullImRequests,
    interestCount: interestCount || 0,
    sectionDwellAvg,
    topSection,
    bottomSection: bottomSection === "N/A" ? "N/A" : bottomSection,
    deviceBreakdown,
  };
}
