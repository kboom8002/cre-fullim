// src/components/mobile-im/ProvenanceBadge.tsx

import React, { useState } from "react";
import { DataPointProvenance, formatProvenanceBadge } from "../../domain/mobile-im/data-provenance";

interface Props {
  provenance: DataPointProvenance;
  compact?: boolean;
}

export const ProvenanceBadge: React.FC<Props> = ({ provenance, compact = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const badgeInfo = formatProvenanceBadge(provenance);

  // 배지 색상 매핑 (vibrant premium HSL-like palettes)
  const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      glow: "shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
      glow: "shadow-[0_0_8px_rgba(59,130,246,0.15)]",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      glow: "shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    },
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      border: "border-indigo-500/20",
      glow: "shadow-[0_0_8px_rgba(99,102,241,0.15)]",
    },
    red: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
      glow: "shadow-[0_0_8px_rgba(239,68,68,0.15)]",
    },
  };

  const currentStyles = colorClasses[badgeInfo.color] || colorClasses.indigo;

  return (
    <div className="relative inline-block ml-2 align-middle select-none">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide border transition-all duration-300 active:scale-95 ${currentStyles.bg} ${currentStyles.text} ${currentStyles.border} ${currentStyles.glow}`}
      >
        <span className="mr-0.5">{badgeInfo.icon}</span>
        {!compact && <span>{badgeInfo.label}</span>}
      </button>

      {/* Premium glassmorphic tooltip box */}
      {showTooltip && (
        <div 
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-3 rounded-lg text-xs leading-relaxed text-slate-200 border shadow-2xl transition-all duration-300 backdrop-blur-md bg-slate-900/95 border-slate-700/50"
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-slate-800">
            <span className="font-bold text-slate-100 flex items-center">
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 bg-${badgeInfo.color}-400`} />
              {badgeInfo.label} 정보
            </span>
            <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${currentStyles.bg} ${currentStyles.text}`}>
              {provenance.confidence.toUpperCase()}
            </span>
          </div>
          <div className="space-y-1">
            <div>
              <span className="text-slate-400 font-medium">출처: </span>
              <span className="font-semibold text-slate-100">{provenance.sourceDetail}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">검증시점: </span>
              <span className="text-[10px] text-slate-300 font-mono">
                {new Date(provenance.lastVerifiedAt).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
};
