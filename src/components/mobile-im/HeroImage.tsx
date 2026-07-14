// src/components/mobile-im/HeroImage.tsx

import React from "react";

interface HeroImageProps {
  photoUrls?: string[];
  title: string;
  areaSignal?: string;
  priceBand?: string;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  photoUrls,
  title,
  areaSignal,
  priceBand
}) => {
  const hasPhoto = photoUrls && photoUrls.length > 0;
  const mainPhoto = hasPhoto ? photoUrls[0] : null;

  return (
    <div className="relative w-full h-[240px] overflow-hidden flex flex-col justify-end px-5 pb-6">
      {/* Background Image / Gradient Mesh */}
      {hasPhoto && mainPhoto ? (
        <>
          <img
            src={mainPhoto}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-[6s]"
          />
          {/* Multi-layered premium overlay to guarantee text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1e]/60 via-transparent to-transparent" />
        </>
      ) : (
        /* Dynamic premium mesh fallback gradient */
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0a0f1e]">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_37%_24%,rgba(99,102,241,0.15)_0,transparent_50%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.1)_0,transparent_50%)] animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] to-transparent" />
        </div>
      )}

      {/* Badges on top */}
      <div className="relative z-10 flex items-center gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur px-2.5 py-0.5 text-[9px] font-bold text-blue-400 uppercase tracking-widest">
          ⚡ PREMIUM BLIND MEMO
        </span>
        {areaSignal && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 border border-slate-700/40 backdrop-blur px-2 py-0.5 text-[9px] font-bold text-slate-300">
            📍 {areaSignal}
          </span>
        )}
      </div>

      {/* Main Metadata Text */}
      <h1 className="relative z-10 text-xl font-black text-white leading-snug tracking-tight mb-2 drop-shadow-md">
        {title}
      </h1>

      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span>JS부동산중개 • Mobile IM Studio</span>
        {priceBand && (
          <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.2 rounded border border-amber-500/20">
            매매가 {priceBand}
          </span>
        )}
      </div>
    </div>
  );
};
