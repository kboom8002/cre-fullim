// src/components/mobile-im/ShareSheet.tsx

import React, { useState } from "react";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
  title: string;
  description: string;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  isOpen,
  onClose,
  publicUrl,
  title,
  description
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `[JS부동산 추천 매물] ${title}\n\n상세 정보 및 예비 투자 검토 문서는 모바일 IM 링크에서 즉시 확인하세요:\n${publicUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: publicUrl,
        });
        onClose();
      } catch (err) {
        // user cancelled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSmsShare = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;
    window.location.href = smsUrl;
    onClose();
  };

  const handleEmailShare = () => {
    const mailUrl = `mailto:?subject=${encodeURIComponent(`[대외비 상업부동산 매물 추천] ${title}`)}&body=${encodeURIComponent(shareText)}`;
    window.location.href = mailUrl;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom sheet */}
      <div 
        className="relative z-10 w-full max-w-md rounded-t-3xl border-t border-slate-800 bg-slate-900 px-5 pt-4 pb-8 space-y-4 shadow-2xl transition-all transform translate-y-0"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Notch */}
        <div className="mx-auto w-12 h-1 rounded-full bg-slate-800" onClick={onClose} />

        <div className="text-left border-b border-slate-800 pb-2">
          <h4 className="text-sm font-black text-slate-200">🚀 모바일 IM 물건 공유하기</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">보안 채널 또는 메신저를 통해 파트너에게 간편히 유통하세요.</p>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2 text-center">
          {/* Native Web Share */}
          <button 
            onClick={handleNativeShare} 
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-950/30 hover:bg-slate-950/60 active:scale-95 transition-all"
          >
            <span className="text-xl">📲</span>
            <span className="text-[10px] font-bold text-slate-400">시스템 공유</span>
          </button>

          {/* SMS */}
          <button 
            onClick={handleSmsShare} 
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-950/30 hover:bg-slate-950/60 active:scale-95 transition-all"
          >
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-bold text-slate-400">문자 전송</span>
          </button>

          {/* Email */}
          <button 
            onClick={handleEmailShare} 
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-950/30 hover:bg-slate-950/60 active:scale-95 transition-all"
          >
            <span className="text-xl">✉️</span>
            <span className="text-[10px] font-bold text-slate-400">이메일 공유</span>
          </button>

          {/* Link Copy */}
          <button 
            onClick={handleCopyLink} 
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-950/30 hover:bg-slate-950/60 active:scale-95 transition-all"
          >
            <span className="text-xl">{copied ? "✓" : "🔗"}</span>
            <span className="text-[10px] font-bold text-slate-400">{copied ? "복사완료" : "링크 복사"}</span>
          </button>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950/50 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-950"
        >
          취소
        </button>
      </div>
    </div>
  );
};
