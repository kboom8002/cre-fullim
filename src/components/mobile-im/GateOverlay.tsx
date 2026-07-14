// src/components/mobile-im/GateOverlay.tsx

import React, { useState, useEffect } from "react";

export interface ViewerInfo {
  email: string;
  name?: string;
  signature?: string;
  signedAt?: string;
  gateLevelPassed: number;
}

interface GateOverlayProps {
  requiredGateLevel: number; // 0: G0, 1: G1, 2: G2, 3: G3
  mobileImProjectId: string;
  onGatePass: (viewerInfo: ViewerInfo) => void;
}

export const GateOverlay: React.FC<GateOverlayProps> = ({
  requiredGateLevel,
  mobileImProjectId,
  onGatePass
}) => {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [agreeCheck, setAgreeCheck] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check if they already passed G1 or G2 in localStorage
  useEffect(() => {
    const cached = localStorage.getItem(`mobile_im_gate_pass_${mobileImProjectId}`);
    if (cached) {
      try {
        const info = JSON.parse(cached) as ViewerInfo;
        if (info.gateLevelPassed >= requiredGateLevel) {
          onGatePass(info);
        } else {
          setCurrentLevel(info.gateLevelPassed);
          setEmail(info.email || "");
          setName(info.name || "");
        }
      } catch (e) {
        // clear corrupted
        localStorage.removeItem(`mobile_im_gate_pass_${mobileImProjectId}`);
      }
    }
  }, [mobileImProjectId, requiredGateLevel, onGatePass]);

  const handleG1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/mobile-im/${mobileImProjectId}/gate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gate_level: "G1", viewer_email: email }),
      });

      if (res.ok) {
        const viewerInfo: ViewerInfo = {
          email,
          gateLevelPassed: 1,
        };

        if (requiredGateLevel <= 1) {
          localStorage.setItem(`mobile_im_gate_pass_${mobileImProjectId}`, JSON.stringify(viewerInfo));
          onGatePass(viewerInfo);
        } else {
          // Go to G2 NDA Signature
          setCurrentLevel(1);
        }
      } else {
        setErrorMsg("이메일 등록에 실패했습니다. 형식 확인 후 다시 시도해 주세요.");
      }
    } catch (err) {
      setErrorMsg("서버 통신에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleG2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !agreeCheck || !signatureText) {
      setErrorMsg("모든 동의 사항 및 디지털 서명을 기입해 주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const signedAt = new Date().toISOString();
      const res = await fetch(`/api/mobile-im/${mobileImProjectId}/gate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gate_level: "G2",
          viewer_email: email,
          nda_agreed: agreeCheck,
          nda_signed_at: signedAt,
        }),
      });

      if (res.ok) {
        const viewerInfo: ViewerInfo = {
          email,
          name,
          signature: signatureText,
          signedAt,
          gateLevelPassed: 2,
        };

        localStorage.setItem(`mobile_im_gate_pass_${mobileImProjectId}`, JSON.stringify(viewerInfo));
        onGatePass(viewerInfo);
      } else {
        setErrorMsg("서명 등록에 실패했습니다.");
      }
    } catch (err) {
      setErrorMsg("서버 통신 중 장애가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (requiredGateLevel === 0) return null;

  // Render Gate level UI
  const isG1Needed = currentLevel < 1 && requiredGateLevel >= 1;
  const isG2Needed = currentLevel < 2 && requiredGateLevel >= 2 && !isG1Needed;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end p-5 bg-slate-950/90 backdrop-blur-md rounded-2xl" style={{ minHeight: "360px" }}>
      {isG1Needed && (
        <form onSubmit={handleG1Submit} className="space-y-4 text-left">
          <div className="text-center mb-2 space-y-1">
            <span className="text-2xl">🔒</span>
            <h3 className="text-sm font-bold text-slate-100">기본 보안 열람 게이트 (G1)</h3>
            <p className="text-[10px] text-slate-400">
              본 권역 및 주요 정보는 예비 열람자의 이메일 인증 등록 후 즉시 공개됩니다.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">업무용 이메일 주소</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {errorMsg && <p className="text-[10px] text-red-400 font-medium">{errorMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg active:scale-98 transition-all"
          >
            {submitting ? "보안 인증 중..." : "인증 등록 후 즉시 열람"}
          </button>
        </form>
      )}

      {isG2Needed && (
        <form onSubmit={handleG2Submit} className="space-y-4 text-left overflow-y-auto max-h-[340px] pr-1">
          <div className="text-center mb-1 space-y-1">
            <span className="text-2xl">🔏</span>
            <h3 className="text-sm font-bold text-slate-100">기밀 유지 협약 동의 게이트 (G2)</h3>
            <p className="text-[9px] text-slate-400">
              상세 재무, 임대현황, 공법적 하자 체크리스트 열람을 위해 디지털 비밀유지확약이 요구됩니다.
            </p>
          </div>

          <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 h-24 overflow-y-auto text-[9px] text-slate-400 leading-relaxed scrollbar-thin">
            <strong className="text-slate-200 block mb-1">[기밀 보장 및 부도 방지 확약서]</strong>
            본 정보이용자는 취득한 자산정보(지번, 재무수치, 임차인구성)가 핵심 대외비 기밀사항임을 인식하며, 
            사전 브로커 협의 없이 제3자 전송, 유출, 타 사이트 등록을 절대 금합니다. 
            위반 시 민형사상 손해배상 청구가 진행될 수 있음을 확인합니다.
          </div>

          <label className="flex items-start gap-2 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={agreeCheck}
              onChange={(e) => setAgreeCheck(e.target.checked)}
              className="mt-0.5 rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-[10px] font-bold text-slate-300">
              상기 대외비 기밀 준수 사항을 확인하였으며, 이에 적극 동의합니다.
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1">성명(실명)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1">전자 서명 (텍스트 기입)</label>
              <input
                type="text"
                required
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="(서명 또는 날인)"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {errorMsg && <p className="text-[9px] text-red-400 font-medium">{errorMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg active:scale-98 transition-all"
          >
            {submitting ? "디지털 협약 생성 중..." : "확약 서명 완료 및 데이터 잠금 해제"}
          </button>
        </form>
      )}
    </div>
  );
};
