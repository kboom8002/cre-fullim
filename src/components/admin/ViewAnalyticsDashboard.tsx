// src/components/admin/ViewAnalyticsDashboard.tsx

import React from "react";
import { ViewAnalyticsSummary } from "../../domain/mobile-im/analytics-service";

interface Props {
  summary: ViewAnalyticsSummary;
  projectName: string;
}

const SECTION_LABELS: Record<string, string> = {
  property_overview:   "🏢 자산 개요",
  location_access:     "📍 입지·대중교통",
  lease_status:        "📋 임대차 현황",
  income_analysis:     "📊 수익률·지가",
  risk_check:          "⚠️ 공법·리스크",
  investment_thesis:   "💡 핵심 메리트",
  next_steps:          "🚀 다음 단계",
};

export const ViewAnalyticsDashboard: React.FC<Props> = ({ summary, projectName }) => {
  const {
    totalViews,
    uniqueViewers,
    kakaoShares,
    fullImRequests,
    interestCount,
    sectionDwellAvg,
    topSection,
    deviceBreakdown
  } = summary;

  // Calculate device percentages
  const totalDevices = (deviceBreakdown.mobile || 0) + (deviceBreakdown.tablet || 0) + (deviceBreakdown.desktop || 0) || 1;
  const mobilePct = Math.round(((deviceBreakdown.mobile || 0) / totalDevices) * 100);
  const tabletPct = Math.round(((deviceBreakdown.tablet || 0) / totalDevices) * 100);
  const desktopPct = Math.round(((deviceBreakdown.desktop || 0) / totalDevices) * 100);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#0a0f1e] text-slate-100 rounded-3xl border border-slate-900 shadow-2xl space-y-6">
      
      {/* Dashboard Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">
            🔑 BROKER ANALYTICS PORTAL
          </span>
          <h2 className="text-xl font-black text-white leading-tight">{projectName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">모바일 IM 실시간 열람 반응 및 전환률 분석 보드</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            실시간 집계 중
          </div>
        </div>
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "총 조회수", val: totalViews, desc: "모바일 IM 누적 열람수", icon: "👁️", color: "text-blue-400" },
          { label: "고유 열람자수", val: uniqueViewers, desc: "중복 제외 순 방문세션", icon: "👤", color: "text-indigo-400" },
          { label: "자료 요청 / LOI", val: interestCount, desc: "매수 관심 등록 건수", icon: "🔥", color: "text-rose-400" },
          { label: "카카오톡 공유", val: kakaoShares, desc: "바이럴 유통 공유수", icon: "💬", color: "text-amber-400" },
        ].map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-4.5 space-y-1 relative overflow-hidden backdrop-blur-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              <span className="text-sm">{item.icon}</span>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight ${item.color} mt-1`}>
              {item.val.toLocaleString()}
            </div>
            <div className="text-[9px] text-slate-600 font-medium">{item.desc}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Section Dwell Times Bar Chart */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-300">⏱️ 섹션별 평균 체류시간 (초 단위)</h3>
            {topSection !== "N/A" && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                최고 관심: {SECTION_LABELS[topSection]?.split(" ")[1] || topSection}
              </span>
            )}
          </div>
          
          <div className="space-y-3.5 pt-1">
            {Object.keys(SECTION_LABELS).map((secKey) => {
              const seconds = sectionDwellAvg[secKey] || 0;
              // Normalize relative to 60s max for display bar width
              const widthPct = Math.min((seconds / 60) * 100, 100);
              
              return (
                <div key={secKey} className="space-y-1 text-left">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400">{SECTION_LABELS[secKey]}</span>
                    <span className="text-slate-300 font-mono">{seconds}초</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Breakdown & Funnel */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 space-y-5">
          {/* Device Types */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2 text-left">📱 접속 디바이스 기기 분석</h3>
            <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden flex">
              <div className="h-full bg-blue-500" style={{ width: `${mobilePct}%` }} />
              <div className="h-full bg-indigo-500" style={{ width: `${tabletPct}%` }} />
              <div className="h-full bg-slate-600" style={{ width: `${desktopPct}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-bold text-slate-400 pt-1">
              <div>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />
                모바일 ({mobilePct}%)
              </div>
              <div>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1" />
                태블릿 ({tabletPct}%)
              </div>
              <div>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600 mr-1" />
                PC ({desktopPct}%)
              </div>
            </div>
          </div>

          {/* Funnel Conversions */}
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">🎯 마케팅 전환율 요약</h3>
            <div className="space-y-2.5">
              {[
                { label: "총 방문 대비 관심 등록률", val: uniqueViewers > 0 ? ((interestCount / uniqueViewers) * 100).toFixed(1) : "0.0", color: "text-rose-400" },
                { label: "Full IM 전환 신청율", val: uniqueViewers > 0 ? ((fullImRequests / uniqueViewers) * 100).toFixed(1) : "0.0", color: "text-blue-400" },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-[10px] text-slate-400 font-medium">{item.label}</span>
                  <span className={`text-xs font-black font-mono ${item.color}`}>{item.val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
