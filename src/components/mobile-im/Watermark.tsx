// src/components/mobile-im/Watermark.tsx

import React from "react";

interface WatermarkProps {
  email?: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ email }) => {
  if (!email || email === "") return null;

  const nowStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const watermarkText = `${email} [CONFIDENTIAL] ${nowStr}`;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden select-none opacity-[0.06] flex flex-col justify-around py-4">
      {[1, 2, 3].map((row) => (
        <div 
          key={row}
          className="flex justify-around text-slate-400 font-mono text-[9px] uppercase tracking-widest font-black"
          style={{
            transform: `rotate(-25deg) scale(${row % 2 === 0 ? 1 : 0.9})`,
            whiteSpace: "nowrap"
          }}
        >
          <span>{watermarkText}</span>
          <span className="hidden xs:inline">{watermarkText}</span>
        </div>
      ))}
    </div>
  );
};
