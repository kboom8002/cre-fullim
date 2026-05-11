"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function MobileIMViewer({ data }: { data: any }) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const handleNext = () => {
    if (currentSectionIndex < data.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const currentSection = data.sections[currentSectionIndex];

  return (
    <div className="flex flex-col h-full h-[calc(100vh-3.5rem)] pb-4">
      {/* Title Area */}
      <div className="bg-slate-900 text-white p-4">
        <h1 className="text-xl font-bold leading-tight mb-1">{data.title}</h1>
        <p className="text-sm text-slate-300">투자 메모 (Mobile IM)</p>
      </div>

      {/* Metrics Banner */}
      <div className="flex border-b border-slate-200 bg-white shadow-sm shrink-0">
        <div className="flex-1 p-2 text-center border-r border-slate-100">
          <div className="text-xs text-slate-500 mb-0.5">수익률(추정)</div>
          <div className="text-sm font-semibold text-slate-800">{data.key_metrics.estimated_yield}</div>
        </div>
        <div className="flex-1 p-2 text-center border-r border-slate-100">
          <div className="text-xs text-slate-500 mb-0.5">임대율</div>
          <div className="text-sm font-semibold text-slate-800">{data.key_metrics.occupancy}</div>
        </div>
        <div className="flex-1 p-2 text-center">
          <div className="text-xs text-slate-500 mb-0.5">가격대</div>
          <div className="text-sm font-semibold text-slate-800">{data.key_metrics.price_band}</div>
        </div>
      </div>

      {/* Content Area - Swipe Simulator */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={handlePrev} 
            disabled={currentSectionIndex === 0}
            className="text-slate-400 disabled:opacity-30 p-2"
          >
            ← 이전
          </button>
          <div className="text-sm font-medium text-slate-500">
            {currentSectionIndex + 1} / {data.sections.length}
          </div>
          <button 
            onClick={handleNext} 
            disabled={currentSectionIndex === data.sections.length - 1}
            className="text-blue-600 font-medium disabled:opacity-30 p-2"
          >
            다음 →
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 min-h-[300px]">
          <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            {currentSection.title}
          </h2>
          <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-700">
            {currentSection.markdown}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5 text-xs text-slate-400 leading-tight mb-4">
        ⚖️ {data.boundary_note}
      </div>

      {/* Upgrade CTA */}
      <div className="mt-auto px-5">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-slate-700">📊 Full IM 준비도</span>
            <span className="text-sm font-bold text-slate-900">{data.full_im_readiness.score}/100</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            상세 IM(18섹션)을 만들려면 다음 자료가 필요합니다:<br/>
            {data.full_im_readiness.missing_for_upgrade.map((item: string) => `□ ${item}`).join(" ")}
          </p>
          <div className="flex gap-2">
            <Button className="w-full bg-slate-900" size="sm">상세 IM 요청하기 →</Button>
            <Button variant="outline" className="w-full" size="sm">카톡으로 공유</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
