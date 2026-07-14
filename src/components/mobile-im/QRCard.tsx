// src/components/mobile-im/QRCard.tsx

import React from "react";

interface QRCardProps {
  publicUrl: string;
  title: string;
  priceBand?: string;
  areaSignal?: string;
  totalAreaSqm?: number;
}

export const QRCard: React.FC<QRCardProps> = ({
  publicUrl,
  title,
  priceBand = "미정",
  areaSignal = "서울 핵심 권역",
  totalAreaSqm = 0
}) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-lg relative print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Print Layout Header (only visible when printing) */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-black pb-3 mb-4">
          <div>
            <h1 className="text-xl font-bold font-sans">🏢 JS부동산중개 전문 물건 요약</h1>
            <p className="text-xs text-slate-500">발행일: {new Date().toLocaleDateString("ko-KR")}</p>
          </div>
          <span className="text-sm font-bold tracking-widest border-2 border-black px-2.5 py-1">CONFIDENTIAL</span>
        </div>

        <div className="flex gap-4 items-center justify-between">
          <div className="space-y-2 text-left">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 print:border-black print:text-black">
              PITCH SUMMARY CARD
            </span>
            <h4 className="text-sm font-black text-slate-200 leading-snug print:text-black print:text-base">
              {title}
            </h4>
            <div className="text-[10px] text-slate-400 space-y-0.5 font-medium print:text-black">
              <div>📍 권역: <span className="text-slate-200 font-bold print:text-black">{areaSignal}</span></div>
              <div>💰 희망가격대: <span className="text-amber-400 font-bold print:text-black">{priceBand}</span></div>
              {totalAreaSqm > 0 && (
                <div>📐 연면적: <span className="text-slate-200 font-bold print:text-black">{totalAreaSqm.toLocaleString()}㎡ (약 {Math.round(totalAreaSqm * 0.3025)}평)</span></div>
              )}
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex-shrink-0 text-center space-y-1 bg-white p-2 rounded-xl border border-slate-800 print:border-black">
            <img 
              src={qrCodeUrl} 
              alt="QR Code to Mobile IM" 
              className="w-20 h-20 print:w-24 print:w-24 object-contain"
            />
            <div className="text-[8px] text-slate-600 font-bold print:text-xs">스캔 후 즉시 열람</div>
          </div>
        </div>

        {/* Action Button (hidden when printing) */}
        <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end print:hidden">
          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-[10px] font-bold text-slate-300 transition-colors hover:bg-slate-850 hover:text-slate-100"
          >
            🖨️ 브로셔/인쇄용 PDF 출력
          </button>
        </div>
      </div>
    </div>
  );
};
