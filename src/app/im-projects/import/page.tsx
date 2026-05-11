"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const router = useRouter();
  const tokenRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{
    im_project_id?: string;
    building_ssot_full_id?: string;
    next_url?: string;
    code?: string;
    message?: string;
  } | null>(null);

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
    } catch {
      setStatus("error");
      setResult({ message: "네트워크 오류가 발생했습니다." });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Import Handoff Payload</h1>
      <p className="text-muted-foreground mb-8">
        MVP에서 가져온 건물 자료를 Full IM Studio에 가져옵니다.
      </p>

      {/* Token Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
        <label htmlFor="handoff-token" className="block text-sm font-medium">
          Handoff Token
        </label>
        <input
          ref={tokenRef}
          id="handoff-token"
          name="handoff_token"
          type="text"
          placeholder="hof_abc123"
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? "처리 중..." : "Import & Create Project"}
        </button>
      </form>

      {/* Success */}
      {status === "success" && result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
          <h2 className="text-lg font-semibold text-green-800">Import Complete</h2>
          <p className="text-sm text-green-700">
            MVP에서 가져온 건물 자료를 확인했습니다.
          </p>
          <dl className="text-sm space-y-1">
            <div className="flex gap-2">
              <dt className="font-medium text-green-800">Project ID:</dt>
              <dd className="text-green-700">{result.im_project_id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-green-800">B-SSoT Full ID:</dt>
              <dd className="text-green-700">{result.building_ssot_full_id}</dd>
            </div>
          </dl>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push(result.next_url ?? "/im-projects")}
              className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              다음 단계 →
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && result && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-red-800">Import Failed</h2>
          <p className="text-sm text-red-700">{result.message}</p>
          {result.code && (
            <p className="text-xs text-red-500">Code: {result.code}</p>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 text-sm text-muted-foreground space-y-2">
        <h3 className="font-medium text-slate-700">다음 단계:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>자료 준비 상태 확인</li>
          <li>부족자료 보강</li>
          <li>Full IM 초안 생성</li>
          <li>전문가 검토 요청</li>
        </ol>
      </div>
    </div>
  );
}
