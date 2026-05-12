"use client";

import React, { useState } from "react";

interface Section {
  section_type: string;
  title: string;
  markdown: string;
}

interface MobileIMData {
  slug: string;
  title: string;
  key_metrics: Record<string, string>;
  sections: Section[];
  boundary_note: string;
  full_im_readiness: { score: number; missing_for_upgrade: string[] };
  kakao_copy?: string;
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
  property_overview:   "from-blue-600 to-blue-500",
  location_access:     "from-emerald-600 to-emerald-500",
  lease_status:        "from-violet-600 to-violet-500",
  income_analysis:     "from-amber-600 to-amber-500",
  risk_check:          "from-red-600 to-red-500",
  investment_thesis:   "from-cyan-600 to-cyan-500",
  next_steps:          "from-indigo-600 to-indigo-500",
};

function parseMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("•")) {
      return (
        <div key={i} className="flex gap-2 py-1">
          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
          <span className="text-sm text-foreground leading-relaxed">{line.substring(1).trim()}</span>
        </div>
      );
    }
    if (line.startsWith("(") || line.includes("주의") || line.includes("예비")) {
      return (
        <p key={i} className="text-xs text-amber-400 mt-2 leading-relaxed italic">
          {line}
        </p>
      );
    }
    return line ? <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p> : <div key={i} className="h-2" />;
  });
}

export default function MobileIMViewer({ data }: { data: MobileIMData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const section = data.sections[currentIdx];
  const progress = ((currentIdx + 1) / data.sections.length) * 100;
  const icon = SECTION_ICONS[section?.section_type] ?? "📄";
  const gradient = SECTION_COLORS[section?.section_type] ?? "from-blue-600 to-indigo-600";
  const readinessScore = data.full_im_readiness.score;
  const readinessColor = readinessScore >= 70 ? "text-emerald-400" : readinessScore >= 50 ? "text-amber-400" : "text-red-400";

  const handleCopy = () => {
    if (data.kakao_copy) {
      navigator.clipboard.writeText(data.kakao_copy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-foreground flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className={`bg-gradient-to-br ${gradient} px-5 pt-8 pb-6`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest">
            📱 Mobile IM
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
            ✓ AI 생성 완료
          </span>
        </div>
        <h1 className="text-xl font-black text-white leading-tight mb-1">{data.title}</h1>
        <p className="text-xs text-white/60">JS부동산중개 | 예비 검토용 투자 메모</p>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            { label: "수익률(추정)", value: data.key_metrics.estimated_yield ?? "—" },
            { label: "임대율",       value: data.key_metrics.occupancy        ?? "—" },
            { label: "가격대",       value: data.key_metrics.price_band       ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-white/15 backdrop-blur px-3 py-3 text-center">
              <div className="text-[9px] text-white/60 mb-1 font-semibold uppercase tracking-wide">{label}</div>
              <div className="text-sm font-black text-white leading-tight">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-white/5">
        <div
          className={`h-full bg-gradient-to-r ${gradient} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Section Navigator */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="rounded-lg bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/70 disabled:opacity-30 transition-opacity hover:bg-white/15"
        >
          ← 이전
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-bold text-white/80">
            {currentIdx + 1} / {data.sections.length}
          </span>
        </div>
        <button
          onClick={() => setCurrentIdx(i => Math.min(data.sections.length - 1, i + 1))}
          disabled={currentIdx === data.sections.length - 1}
          className="rounded-lg bg-primary/30 px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-30 transition-opacity hover:bg-primary/40"
        >
          다음 →
        </button>
      </div>

      {/* Section Dots */}
      <div className="flex items-center justify-center gap-1.5 py-2">
        {data.sections.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`rounded-full transition-all duration-200 ${
              i === currentIdx
                ? "w-5 h-2 bg-primary"
                : "w-2 h-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Section Content */}
      <div className="flex-1 px-5 pb-4">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5 min-h-[220px] space-y-2">
          <h2 className="text-base font-black text-white mb-4 flex items-center gap-2">
            <span>{icon}</span>
            {section?.title}
          </h2>
          <div className="space-y-0.5">
            {section?.markdown ? parseMarkdown(section.markdown) : (
              <p className="text-sm text-white/40">내용 없음</p>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-3">
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 px-4 py-3">
          <p className="text-[10px] text-amber-400/80 leading-relaxed">
            ⚖️ {data.boundary_note}
          </p>
        </div>
      </div>

      {/* Full IM Upgrade CTA */}
      <div className="px-5 pb-4">
        <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">📊 Full IM 준비도</p>
              <p className="text-[10px] text-white/40 mt-0.5">18섹션 상세 투자설명서 업그레이드</p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-black tabular-nums ${readinessColor}`}>
                {readinessScore}
              </span>
              <span className="text-xs text-white/40">/100</span>
            </div>
          </div>

          {data.full_im_readiness.missing_for_upgrade.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-amber-400 font-semibold">추가 자료 필요:</p>
              <div className="flex flex-wrap gap-1.5">
                {data.full_im_readiness.missing_for_upgrade.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-amber-800/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-mono text-amber-300"
                  >
                    □ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <a
              href="/im-projects"
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-center text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              상세 IM 요청 →
            </a>
            {data.kakao_copy && (
              <button
                onClick={handleCopy}
                className="flex-1 rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/15"
              >
                {copied ? "✓ 복사됨" : "💬 카톡 공유"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
