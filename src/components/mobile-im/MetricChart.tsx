// src/components/mobile-im/MetricChart.tsx

import React from "react";

interface MetricChartProps {
  type: "yield" | "occupancy";
  value: number; // 수익률(%), 또는 임대율(%)
  label?: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({ type, value, label }) => {
  if (type === "yield") {
    // 1. Donut Chart for Yield (수익률)
    // Value range expected: 0% to 10%
    const targetValue = Math.min(Math.max(value, 0), 10);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (targetValue / 10) * circumference;

    return (
      <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-800 bg-slate-950/20 text-center relative w-full">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            {/* Background Circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-slate-800 fill-none"
              strokeWidth="6"
            />
            {/* Value/Indicator Circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-amber-500 fill-none transition-all duration-1000 ease-out"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          {/* Central Label */}
          <div className="absolute text-center">
            <span className="text-base font-black text-slate-100 leading-tight">
              {value.toFixed(2)}%
            </span>
            {label && <div className="text-[8px] text-slate-500 font-semibold mt-0.5">{label}</div>}
          </div>
        </div>
      </div>
    );
  } else {
    // 2. Bar Chart for Occupancy/Rent Status (임대율)
    // Value range expected: 0% to 100%
    const occupancy = Math.min(Math.max(value, 0), 100);
    const vacancy = 100 - occupancy;

    return (
      <div className="w-full space-y-2 p-4 rounded-xl border border-slate-800 bg-slate-950/20">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-slate-400">{label || "임대차 안정성"}</span>
          <span className="text-emerald-400">임대율 {occupancy}%</span>
        </div>
        
        {/* HSL-gradient horizontal bar */}
        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-l-full transition-all duration-1000 ease-out"
            style={{ width: `${occupancy}%` }}
          />
          {vacancy > 0 && (
            <div 
              className="h-full bg-slate-900 transition-all duration-1000 ease-out"
              style={{ width: `${vacancy}%` }}
            />
          )}
        </div>

        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
          <span>임대중 ({occupancy}%)</span>
          <span>공실 ({vacancy}%)</span>
        </div>
      </div>
    );
  }
};
