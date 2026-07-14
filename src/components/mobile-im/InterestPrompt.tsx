// src/components/mobile-im/InterestPrompt.tsx

import React, { useState } from "react";

interface InterestPromptProps {
  mobileImProjectId: string;
  slug: string;
  onInterestSubmitted?: () => void;
}

export const InterestPrompt: React.FC<InterestPromptProps> = ({
  mobileImProjectId,
  slug,
  onInterestSubmitted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/mobile-im/${mobileImProjectId}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        if (onInterestSubmitted) onInterestSubmitted();
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setFormData({ name: "", email: "", phone: "", message: "" });
        }, 2500);
      }
    } catch (err) {
      console.error("Failed to submit interest:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-5 text-center shadow-lg backdrop-blur">
        <h3 className="text-sm font-bold text-slate-100 mb-2">🔥 본 자산에 매수 관심이 있으신가요?</h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          예비 검토 자료를 검토하신 후, 추가적인 가치 평가나 실사 자료(임대차 요약표 등) 요청을 진행하실 수 있습니다.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all duration-300 hover:opacity-95 active:scale-[0.98]"
          >
            🔥 관심 물건으로 등록
          </button>
          <button
            onClick={() => alert("관심 없음 피드백이 등록되었습니다. 더 나은 자산 추천에 활용하겠습니다.")}
            className="rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-2.5 text-xs font-bold text-slate-400 transition-all duration-300 hover:bg-slate-800"
          >
            패스
          </button>
        </div>
      </div>

      {/* Premium Interest Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            
            {success ? (
              <div className="text-center py-8 space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-2xl animate-bounce">
                  ✓
                </div>
                <h4 className="text-sm font-bold text-slate-100">관심 표명이 접수되었습니다!</h4>
                <p className="text-[11px] text-slate-400">담당 브로커에게 실시간 알림이 전송되었으며, 신속히 회신드리겠습니다.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <span>🔥</span> 관심 물건 등록 & 자료 요청
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                  >
                    닫기
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">이름 *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="홍길동"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">이메일 주소 *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@domain.com"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">전화번호 (선택)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="010-0000-0000"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">전달할 메시지 (선택)</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Full IM, 임대차 요약표 등의 상세 자료 검토를 희망합니다."
                      rows={3}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-50 transition-all duration-300 hover:opacity-95 active:scale-[0.98]"
                >
                  {submitting ? "제출 중..." : "제출 완료"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
