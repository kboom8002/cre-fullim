// src/components/mobile-im/QuestionButton.tsx

import React, { useState } from "react";

interface QuestionButtonProps {
  mobileImProjectId: string;
  sectionType: string;
  sectionTitle: string;
  viewerEmail?: string;
}

export const QuestionButton: React.FC<QuestionButtonProps> = ({
  mobileImProjectId,
  sectionType,
  sectionTitle,
  viewerEmail = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState(viewerEmail);
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/mobile-im/${mobileImProjectId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_type: sectionType,
          viewer_email: email || "anonymous@viewer.com",
          question_text: questionText,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setQuestionText("");
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to post question:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="inline-block mt-2">
      <button
        onClick={() => {
          setIsOpen(true);
          if (viewerEmail) setEmail(viewerEmail);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 text-[10px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
      >
        <span>💬</span> {sectionTitle.split(" ")[1] || "본 섹션"} 관련 질문하기
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl relative text-left">
            {success ? (
              <div className="text-center py-6 space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xl animate-bounce">
                  ✓
                </div>
                <h4 className="text-xs font-bold text-slate-100">질문이 등록되었습니다!</h4>
                <p className="text-[10px] text-slate-500">브로커가 답변을 등록하면 입력하신 이메일로 회신이 전달됩니다.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>💬</span> 섹션 실시간 질의응답
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                  >
                    닫기
                  </button>
                </div>

                <p className="text-[9px] text-slate-500 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-900">
                  선택한 섹션: <span className="text-slate-300 font-bold">{sectionTitle}</span>
                </p>

                <div className="space-y-3">
                  {!viewerEmail && (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-1">답변 수신용 이메일 주소</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@company.com"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">질문 내용</label>
                    <textarea
                      required
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="공실 보증 기간이 어떻게 되나요? 혹은 용도지역 증축 인허가 상태가 궁금합니다."
                      rows={3}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-xs font-bold text-white shadow-lg active:scale-98 transition-all disabled:opacity-50"
                >
                  {submitting ? "질문 등록 중..." : "질문 전달하기"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
