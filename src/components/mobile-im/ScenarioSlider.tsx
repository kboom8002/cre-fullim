// src/components/mobile-im/ScenarioSlider.tsx

import React, { useState, useEffect } from "react";
import { calculateScenario, ScenarioInput, ScenarioOutput } from "../../domain/mobile-im/scenario-calculator";

interface ScenarioSliderProps {
  baseMonthlyRent: number;
  purchasePrice: number;
}

export const ScenarioSlider: React.FC<ScenarioSliderProps> = ({
  baseMonthlyRent,
  purchasePrice
}) => {
  // Sliders state
  const [vacancyPct, setVacancyPct] = useState(5); // Default 5% vacancy
  const [rentAdjustPct, setRentAdjustPct] = useState(0); // Default 0% (no adjustment)
  const [interestPct, setInterestPct] = useState(4.5); // Default 4.5% interest

  const [outputs, setOutputs] = useState<ScenarioOutput | null>(null);

  const LTV_RATIO = 60; // 60% fixed LTV assumption for IM Lite
  const OPEX_RATIO = 10; // 10% fixed operating expenses assumption

  useEffect(() => {
    // Adjusted monthly rent
    const adjustedRent = baseMonthlyRent * (1 + rentAdjustPct / 100);

    const input: ScenarioInput = {
      baseMonthlyRent: adjustedRent,
      vacancyRatePct: vacancyPct,
      opexRatePct: OPEX_RATIO,
      purchasePrice,
      interestRatePct: interestPct,
      ltvPct: LTV_RATIO
    };

    const res = calculateScenario(input);
    setOutputs(res);
  }, [vacancyPct, rentAdjustPct, interestPct, baseMonthlyRent, purchasePrice]);

  if (!outputs) return null;

  return (
    <div className="w-full space-y-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2 text-xs font-bold text-slate-200">
        <span>📊</span> What-if 수익률 민감도 시뮬레이션
      </div>

      {/* Sliders Grid */}
      <div className="space-y-3.5 text-left">
        {/* Sliders 1: Vacancy */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>공실률 가정</span>
            <span className="text-blue-400">{vacancyPct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={vacancyPct}
            onChange={(e) => setVacancyPct(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Sliders 2: Rent Adjust */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>시장 임대료 변동율</span>
            <span className={rentAdjustPct >= 0 ? "text-emerald-400" : "text-red-400"}>
              {rentAdjustPct >= 0 ? `+${rentAdjustPct}` : rentAdjustPct}%
            </span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="5"
            value={rentAdjustPct}
            onChange={(e) => setRentAdjustPct(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Sliders 3: Interest Rate */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>대출 금리 (LTV {LTV_RATIO}% 고정)</span>
            <span className="text-amber-400">{interestPct.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="2.5"
            max="7.0"
            step="0.1"
            value={interestPct}
            onChange={(e) => setInterestPct(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Outputs Grid */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/60 text-center">
        <div className="rounded-lg bg-slate-950/40 p-2 border border-slate-800/40">
          <div className="text-[8px] text-slate-500 uppercase font-semibold">예상 Cap Rate</div>
          <div className="text-xs font-black text-slate-100 mt-0.5">{outputs.capRate}%</div>
        </div>
        <div className="rounded-lg bg-slate-950/40 p-2 border border-slate-800/40">
          <div className="text-[8px] text-slate-500 uppercase font-semibold">CoC 수익률</div>
          <div className={`text-xs font-black mt-0.5 ${outputs.cashOnCash >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {outputs.cashOnCash}%
          </div>
        </div>
        <div className="rounded-lg bg-slate-950/40 p-2 border border-slate-800/40">
          <div className="text-[8px] text-slate-500 uppercase font-semibold">부채감당률(DSCR)</div>
          <div className={`text-xs font-black mt-0.5 ${outputs.dscr >= 1.2 ? "text-slate-100" : "text-amber-400"}`}>
            {outputs.dscr}
          </div>
        </div>
      </div>

      {/* Safety Warning note */}
      <p className="text-[8px] text-amber-500/80 leading-relaxed text-left">
        ⚠️ 본 시뮬레이션은 단순 예비 조율용이며, 금리 변동 및 실제 공실 여건에 따라 Cash-on-Cash와 부채감당 지표는 수시로 변동할 수 있습니다.
      </p>
    </div>
  );
};
