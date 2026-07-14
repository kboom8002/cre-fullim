// src/components/mobile-im/PhotoGallery.tsx

import React, { useState, useRef } from "react";

interface PhotoGalleryProps {
  photoUrls?: string[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photoUrls }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasPhotos = photoUrls && photoUrls.length > 0;
  const list = hasPhotos ? photoUrls : [];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    const scrollLeft = scrollRef.current.scrollLeft;
    const newIdx = Math.round(scrollLeft / width);
    setActiveIdx(newIdx);
  };

  if (list.length === 0) {
    // Beautiful dynamic blueprint styling placeholder for when no photos are uploaded
    return (
      <div className="rounded-xl border border-dashed border-blue-500/30 bg-blue-950/10 p-5 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
        <svg className="w-10 h-10 text-blue-500/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[11px] font-bold text-blue-400">자산 외관 및 공용부 사진 미지정</span>
        <span className="text-[9px] text-slate-500 mt-1 max-w-[220px]">
          현물 실사 전 보안 유지를 위하여 실제 대외비 건축 외장재 도면 및 핵심 위치 구조 분석으로 갈음합니다.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      {/* Horizontal scroll container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none rounded-xl"
        style={{ scrollbarWidth: "none" }}
      >
        {list.map((url, idx) => (
          <div 
            key={idx} 
            className="w-full flex-shrink-0 snap-center snap-always rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 aspect-[16/10] relative"
          >
            <img 
              src={url} 
              alt={`Property detail ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 rounded-md bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 text-[9px] text-slate-400 font-mono">
              {idx + 1} / {list.length}
            </div>
          </div>
        ))}
      </div>

      {/* Slide indicators dots */}
      {list.length > 1 && (
        <div className="flex justify-center gap-1.5 py-1">
          {list.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (scrollRef.current) {
                  const width = scrollRef.current.clientWidth;
                  scrollRef.current.scrollTo({ left: idx * width, behavior: "smooth" });
                }
              }}
              className={`rounded-full transition-all duration-300 ${
                idx === activeIdx 
                  ? "w-4 h-1.5 bg-blue-500" 
                  : "w-1.5 h-1.5 bg-slate-800 hover:bg-slate-700"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
