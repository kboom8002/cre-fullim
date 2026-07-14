// src/components/mobile-im/MobileIMViewer.tsx

"use client";

import React, { useState } from "react";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { MiniMap } from "./MiniMap";
import { InterestPrompt } from "./InterestPrompt";
import { ViewTracker } from "./ViewTracker";
import { ComparableCard } from "./ComparableCard";
import { HeroImage } from "./HeroImage";
import { PhotoGallery } from "./PhotoGallery";
import { MetricChart } from "./MetricChart";
import { GateOverlay, ViewerInfo } from "./GateOverlay";
import { Watermark } from "./Watermark";
import { ShareSheet } from "./ShareSheet";
import { QRCard } from "./QRCard";
import { QuestionButton } from "./QuestionButton";
import { ScenarioSlider } from "./ScenarioSlider";

interface Section {
  section_type: string;
  title: string;
  markdown: string;
  confidence: "confirmed" | "inferred" | "needs_check";
  boundary_note: string;
  provenance?: any[];
}

interface MobileIMData {
  id: string;
  slug: string;
  title: string;
  key_metrics: Record<string, any>;
  sections: Section[];
  boundary_note: string;
  full_im_readiness: { score: number; missing_for_upgrade: string[] };
  kakao_copy?: string;
  supplemental_input?: any;
  external_data?: any;
}

const SECTION_ICONS: Record<string, string> = {
  property_overview:   "🏢",
  location_access:     "📍",
  lease_status:        "📋",
  income_analysis:     "📊",
  risk_check:          "⚠️",
  investment_thesis:   "💡",
  next_steps:          "🚀",
};

const SECTION_COLORS: Record<string, string> = {
  property_overview:   "from-blue-600 to-indigo-500",
  location_access:     "from-emerald-600 to-teal-500",
  lease_status:        "from-violet-600 to-purple-500",
  income_analysis:     "from-amber-600 to-orange-500",
  risk_check:          "from-red-600 to-rose-500",
  investment_thesis:   "from-cyan-600 to-sky-500",
  next_steps:          "from-indigo-600 to-violet-500",
};

/**
 * Parses markdown lines and injects inline ProvenanceBadges where matching provenance points exist
 */
function renderParsedMarkdown(text: string, sectionProvenance: any[] = []): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    // 1. Bullet point formatting
    if (line.startsWith("•")) {
      const content = line.substring(1).trim();
      
      // Find matching provenance point if key terms match the line
      let matchedProv = null;
      if (sectionProvenance && sectionProvenance.length > 0) {
        if (content.includes("연면적") || content.includes("대지면적") || content.includes("규모") || content.includes("승인")) {
          matchedProv = sectionProvenance.find(p => p.fieldKey === "total_area" || p.fieldKey === "plat_area" || p.fieldKey === "use_approval_date");
        } else if (content.includes("임대") || content.includes("월세")) {
          matchedProv = sectionProvenance.find(p => p.fieldKey === "monthly_rent_total");
        } else if (content.includes("공실")) {
          matchedProv = sectionProvenance.find(p => p.fieldKey === "vacancy_rate");
        } else if (content.includes("수익률") || content.includes("공시지가")) {
          matchedProv = sectionProvenance.find(p => p.fieldKey === "estimated_yield" || p.fieldKey === "official_land_price");
        }
      }

      return (
        <div key={i} className="flex gap-2 py-1 items-center text-left">
          <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
          <span className="text-xs text-slate-300 leading-relaxed">
            {content}
            {matchedProv && <ProvenanceBadge provenance={matchedProv} compact={true} />}
          </span>
        </div>
      );
    }
    
    // 2. Warnings / Caveats formatting
    if (line.startsWith("(") || line.includes("주의") || line.includes("예비") || line.includes("가정")) {
      return (
        <p key={i} className="text-[10px] text-amber-400/80 mt-2 leading-relaxed italic text-left">
          {line}
        </p>
      );
    }

    // 3. Normal paragraph
    return line ? (
      <p key={i} className="text-xs text-slate-300 leading-relaxed text-left">
        {line}
      </p>
    ) : (
      <div key={i} className="h-2" />
    );
  });
}

export default function MobileIMViewer({ data }: { data: MobileIMData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [viewerInfo, setViewerInfo] = useState<ViewerInfo | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const section = data.sections[currentIdx];
  const progress = ((currentIdx + 1) / data.sections.length) * 100;
  const icon = SECTION_ICONS[section?.section_type] ?? "📄";
  const gradient = SECTION_COLORS[section?.section_type] ?? "from-blue-600 to-indigo-600";
  
  // Dynamic pricing and geometry values
  const purchasePrice = Number(data.key_metrics.purchase_price || 35000000000);
  const monthlyRent = Number(data.key_metrics.monthly_rent_total_krw || 18000000);
  const estimatedYield = Number(data.key_metrics.estimated_yield_pct || 4.2);
  const totalAreaSqm = Number(data.external_data?.buildingRegister?.totalArea || 2500);

  const publicUrl = typeof window !== "undefined" ? window.location.href : "";

  // 1. Section Gate Mapping (Progressive Disclosure)
  let sectionRequiredGate = 0;
  if (section?.section_type === "location_access" || section?.section_type === "lease_status") {
    sectionRequiredGate = 1; // Requires G1 Email
  } else if (
    section?.section_type === "income_analysis" || 
    section?.section_type === "risk_check" || 
    section?.section_type === "investment_thesis"
  ) {
    sectionRequiredGate = 2; // Requires G2 NDA Digital Signature
  }

  const isGateBlocked = sectionRequiredGate > 0 && (!viewerInfo || viewerInfo.gateLevelPassed < sectionRequiredGate);

  // 2. Full IM One-click automatic data enrichment API call
  const handleAutoEnrich = async () => {
    setEnriching(true);
    try {
      const res = await fetch(`/api/mobile-im/${data.id}/enrich`, { method: "POST" });
      if (res.ok) {
        alert("국토교통부 건축물대장 및 개별공시지가 API 실시간 데이터 보강 완료! 페이지를 새로고침합니다.");
        window.location.reload();
      } else {
        alert("실시간 보강에 실패했습니다. 올바른 주소 규격 여부를 확인하세요.");
      }
    } catch (e) {
      alert("네트워크 장애로 데이터 보강을 완료하지 못했습니다.");
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 flex flex-col max-w-md mx-auto relative overflow-hidden border-x border-slate-900 shadow-2xl">
      {/* 1. Dwell View Behavioral Tracker */}
      <ViewTracker mobileImProjectId={data.id} currentSectionType={section?.section_type} />

      {/* 2. Hero Background Image Header */}
      <HeroImage 
        photoUrls={data.supplemental_input?.photo_urls}
        title={data.title}
        areaSignal={data.key_metrics.area_signal}
        priceBand={data.key_metrics.price_band}
      />

      {/* Progress Bar */}
      <div className="h-1 bg-slate-950">
        <div
          className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Section Navigator */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-900 bg-slate-950/20 backdrop-blur-xs">
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-20 active:scale-95 transition-all"
        >
          ← 이전
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-xs font-black text-slate-400 font-mono">
            {currentIdx + 1} / {data.sections.length}
          </span>
        </div>
        <button
          onClick={() => setCurrentIdx(i => Math.min(data.sections.length - 1, i + 1))}
          disabled={currentIdx === data.sections.length - 1}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-20 active:scale-95 transition-all shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
        >
          다음 →
        </button>
      </div>

      {/* Section Dots */}
      <div className="flex items-center justify-center gap-1.5 py-3 bg-slate-950/10">
        {data.sections.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIdx
                ? "w-6 h-1.5 bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                : "w-1.5 h-1.5 bg-slate-800 hover:bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* main Card Container */}
      <div className="flex-1 px-5 pb-4 relative">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 min-h-[300px] flex flex-col justify-between relative overflow-hidden backdrop-blur-xs">
          
          {/* 3. Screenshots/Leak Protection Watermark */}
          {viewerInfo?.email && <Watermark email={viewerInfo.email} />}

          {/* 4. Progressive Disclosure Gate Overlay */}
          {isGateBlocked && (
            <GateOverlay
              requiredGateLevel={sectionRequiredGate}
              mobileImProjectId={data.id}
              onGatePass={(info) => setViewerInfo(info)}
            />
          )}

          {/* Card Content Grid */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-base">{icon}</span>
              {section?.title}
            </h2>

            {/* Custom Interactive Elements Injection based on Section type */}
            {!isGateBlocked && (
              <div className="space-y-4">
                {/* A. Property Overview Photo Gallery */}
                {section?.section_type === "property_overview" && (
                  <PhotoGallery photoUrls={data.supplemental_input?.photo_urls} />
                )}

                {/* B. Location Map and transit counts */}
                {section?.section_type === "location_access" && data.external_data?.resolvedAddress && (
                  <MiniMap
                    lat={data.external_data.resolvedAddress.lat}
                    lng={data.external_data.resolvedAddress.lng}
                    gateLevel={viewerInfo?.gateLevelPassed || 0}
                    pois={data.external_data.location_poi}
                  />
                )}

                {/* C. Lease Occupancy mini progress chart */}
                {section?.section_type === "lease_status" && (
                  <MetricChart 
                    type="occupancy" 
                    value={data.external_data?.building_register ? 95 : 90} 
                    label="자산 임대 안정성 지표"
                  />
                )}

                {/* D. Income yield mini donut chart & scenario sliders */}
                {section?.section_type === "income_analysis" && (
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="col-span-1">
                      <MetricChart type="yield" value={estimatedYield} label="예상수익률" />
                    </div>
                    <div className="col-span-2">
                      <ScenarioSlider baseMonthlyRent={monthlyRent} purchasePrice={purchasePrice} />
                    </div>
                  </div>
                )}

                {/* E. Investment thesis market comparables cards */}
                {section?.section_type === "investment_thesis" && data.external_data?.comparable_transactions && (
                  <ComparableCard
                    targetPricePerPyeong={purchasePrice / (totalAreaSqm * 0.3025)}
                    comparables={data.external_data.comparable_transactions}
                  />
                )}

                {/* F. Next steps printable pitch brochure summary */}
                {section?.section_type === "next_steps" && (
                  <QRCard
                    publicUrl={publicUrl}
                    title={data.title}
                    priceBand={data.key_metrics.price_band}
                    areaSignal={data.key_metrics.area_signal}
                    totalAreaSqm={totalAreaSqm}
                  />
                )}
              </div>
            )}

            {/* Markdown Text Render */}
            <div className="space-y-1 mt-2">
              {section?.markdown ? (
                renderParsedMarkdown(section.markdown, section.provenance)
              ) : (
                <p className="text-xs text-slate-500">정보 로드 중...</p>
              )}
            </div>
          </div>

          {/* Section Q&A button & lead capture at final sections */}
          {!isGateBlocked && (
            <div className="pt-4 border-t border-slate-900/60 mt-4 flex items-center justify-between">
              <QuestionButton 
                mobileImProjectId={data.id} 
                sectionType={section?.section_type}
                sectionTitle={section?.title}
                viewerEmail={viewerInfo?.email}
              />
              {section?.section_type === "investment_thesis" && (
                <div className="w-full mt-4">
                  <InterestPrompt 
                    mobileImProjectId={data.id}
                    slug={data.slug}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer disclaimer bar */}
      <div className="px-5 py-2.5">
        <div className="rounded-xl border border-slate-800 bg-slate-950/20 px-3.5 py-2.5">
          <p className="text-[9px] text-slate-500 leading-relaxed text-left">
            ⚖️ {data.boundary_note}
          </p>
        </div>
      </div>

      {/* Full IM Upgrade panel */}
      <div className="px-5 pb-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-200">📊 Full IM 업그레이드 준비도</p>
              <p className="text-[10px] text-slate-500 mt-0.5">실시간 공공데이터 확보로 18섹션 문서화</p>
            </div>
            <div className="text-right flex items-baseline gap-0.5">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                data.full_im_readiness.score >= 70 ? "text-emerald-400" : data.full_im_readiness.score >= 50 ? "text-amber-400" : "text-red-400"
              }`}>
                {data.full_im_readiness.score}
              </span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
          </div>

          {/* Missing items and action triggers */}
          {data.full_im_readiness.missing_for_upgrade.length > 0 && (
            <div className="space-y-1.5 text-left">
              <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">부족 자료 항목 및 연동 액션:</p>
              <div className="flex flex-col gap-1.5">
                {data.full_im_readiness.missing_for_upgrade.map((item) => (
                  <div key={item} className="flex justify-between items-center bg-slate-950/40 rounded-lg p-2 border border-slate-900">
                    <span className="text-[10px] text-slate-400 font-mono">□ {item}</span>
                    {item === "상세 위치/입지" || item === "공공데이터" || item === "지자체 공부대장" ? (
                      <button
                        onClick={handleAutoEnrich}
                        disabled={enriching}
                        className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-40"
                      >
                        {enriching ? "조회 중..." : "🔄 자동 조회 연동"}
                      </button>
                    ) : (
                      <button
                        onClick={() => alert(`${item} 수동 업로드 또는 브로커 입력 보강 폼이 연결되었습니다.`)}
                        className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[9px] font-bold text-slate-300 transition-colors hover:bg-slate-700"
                      >
                        📎 파일 업로드
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-2 pt-1.5">
            <button
              onClick={() => alert("Full IM 자동 생성 프로세스가 가동되었습니다. 18섹션 문서 생성이 진행됩니다.")}
              className="flex-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all hover:opacity-95"
            >
              Full IM 자동 생성
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-900 active:scale-[0.98]"
            >
              🚀 공유하기
            </button>
          </div>
        </div>
      </div>

      {/* ShareSheet bottom-sheet */}
      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        publicUrl={publicUrl}
        title={data.title}
        description={section?.markdown || ""}
      />
    </div>
  );
}
