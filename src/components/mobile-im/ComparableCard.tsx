// src/components/mobile-im/ComparableCard.tsx

import React from "react";
import { ComparableTransaction } from "../../lib/external/real-transaction-api";

interface ComparableCardProps {
  targetPricePerPyeong: number;
  comparables: ComparableTransaction[];
}

export const ComparableCard: React.FC<ComparableCardProps> = ({
  targetPricePerPyeong,
  comparables
}) => {
  if (!comparables || comparables.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-center">
        <p className="text-xs text-slate-500">지자체 정밀 실거래 거래 데이터 취합 중...</p>
      </div>
    );
  }

  // Calculate average per pyeong price
  const avgPrice = Math.round(
    comparables.reduce((acc, c) => acc + c.pricePerPyeong, 0) / comparables.length
  );

  const diffPct = ((targetPricePerPyeong - avgPrice) / avgPrice) * 100;
  const isCheaper = diffPct < 0;

  return (
    <div className="space-y-4">
      {/* 벤치마크 요약 헤더 */}
      <div className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400">⚖️ 실거래 시세 벤치마크</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            isCheaper ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}>
            {isCheaper 
              ? `평균 시세 대비 ${Math.abs(diffPct).toFixed(1)}% 저렴` 
              : `평균 시세 대비 ${Math.abs(diffPct).toFixed(1)}% 수준`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/40">
          <div>
            <div className="text-[9px] text-slate-500 uppercase font-semibold">대상 물건 평당 단가</div>
            <div className="text-sm font-black text-slate-100 mt-0.5">
              {Math.round(targetPricePerPyeong / 10000).toLocaleString()}만원/평
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase font-semibold">주변 실거래 평균 평당 단가</div>
            <div className="text-sm font-black text-slate-300 mt-0.5">
              {Math.round(avgPrice / 10000).toLocaleString()}만원/평
            </div>
          </div>
        </div>
      </div>

      {/* 비교 거래 목록 리스트 */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
          📍 최근 주변 상업용 실거래 매각 사례 ({comparables.length}건)
        </div>
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
          {comparables.map((item, idx) => (
            <div 
              key={idx} 
              className="rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2 flex items-center justify-between gap-3 text-left transition-all hover:bg-slate-900/40"
            >
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-300 truncate">{item.address}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  {item.buildingUse} • 지상 {item.floors}층 • {item.dealYear}년 {item.dealMonth}월 거래
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[11px] font-black text-slate-200">
                  {(item.dealAmount / 100000000).toFixed(1)}억원
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  {Math.round(item.pricePerPyeong / 10000).toLocaleString()}만/평
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
