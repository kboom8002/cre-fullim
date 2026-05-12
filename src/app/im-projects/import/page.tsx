"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ImportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{
    im_project_id?: string;
    building_ssot_full_id?: string;
    next_url?: string;
    code?: string;
    message?: string;
  } | null>(null);

  // URL 쿼리스트링 token 자동 입력 (DealCard → Full IM 핸드오프)
  useEffect(() => {
    const token = searchParams.get("token");
    if (token && tokenRef.current) {
      tokenRef.current.value = token;
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenRef.current?.value?.trim();
    if (!token) return;

    setStatus("loading");
    setResult(null);

    try {
      const res = await fetch("/api/im-projects/import-from-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handoff_token: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setResult(data);
        return;
      }

      setStatus("success");
      setResult(data);

      // 성공 시 1.5초 후 자동 이동
      setTimeout(() => {
        router.push(data.next_url ?? "/im-projects");
      }, 1500);
    } catch {
      setStatus("error");
      setResult({ message: "네트워크 오류가 발생했습니다." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            📄 Full IM Studio
          </div>
          <h1 className="text-3xl font-black text-foreground">
            딜카드 데이터 가져오기
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            MVP에서 생성된 핸드오프 토큰을 입력하면<br />
            건물 데이터가 자동으로 Full IM 프로젝트로 변환됩니다.
          </p>
        </div>

        {/* Import Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-8 space-y-5 shadow-xl"
        >
          <div className="space-y-2">
            <label
              htmlFor="handoff-token"
              className="block text-sm font-semibold text-foreground"
            >
              핸드오프 토큰
            </label>
            <input
              ref={tokenRef}
              id="handoff-token"
              name="handoff_token"
              type="text"
              placeholder="hof_abc123…"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-mono"
              required
            />
            <p className="text-xs text-muted-foreground">
              DealCard 결과 화면의 &apos;Full IM Studio에서 투자각서 만들기&apos; 버튼을 클릭하면 자동 입력됩니다.
            </p>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            id="btn-import-handoff"
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-blue-900/30"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                데이터 변환 중…
              </span>
            ) : (
              "📥 가져오기 & 프로젝트 시작"
            )}
          </button>
        </form>

        {/* Success */}
        {status === "success" && result && (
          <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-bold text-emerald-300">가져오기 완료!</p>
                <p className="text-xs text-emerald-400/70">
                  잠시 후 프로젝트 대시보드로 이동합니다…
                </p>
              </div>
            </div>
            <dl className="space-y-1.5 text-xs font-mono">
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Project ID:</dt>
                <dd className="text-emerald-300 truncate">{result.im_project_id}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">B-SSoT Full ID:</dt>
                <dd className="text-emerald-300 truncate">{result.building_ssot_full_id}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => router.push(result.next_url ?? "/im-projects")}
              className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              프로젝트 대시보드로 이동 →
            </button>
          </div>
        )}

        {/* Error */}
        {status === "error" && result && (
          <div className="rounded-2xl border border-red-800/50 bg-red-950/30 p-5 space-y-2">
            <p className="text-sm font-bold text-red-400">❌ 가져오기 실패</p>
            <p className="text-xs text-red-300/80">{result.message}</p>
            {result.code && (
              <p className="text-xs text-muted-foreground font-mono">Code: {result.code}</p>
            )}
          </div>
        )}

        {/* Workflow Info */}
        <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            작업 흐름
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              "① 핸드오프 수신",
              "② Readiness 검토",
              "③ 18-섹션 생성",
              "④ 전문가 패치",
              "⑤ Gate 검토",
              "⑥ Full IM 내보내기",
            ].map((step) => (
              <span
                key={step}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground"
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    }>
      <ImportForm />
    </Suspense>
  );
}
