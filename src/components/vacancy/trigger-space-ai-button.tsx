"use client";

import { useState } from "react";

interface TriggerSpaceAIButtonProps {
  projectId: string;
  className?: string;
}

export function TriggerSpaceAIButton({
  projectId,
  className = "",
}: TriggerSpaceAIButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [spaceAiUrls, setSpaceAiUrls] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleTrigger = async () => {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/im-projects/${projectId}/trigger-space-ai`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Space AI 연동 실패");
      }

      const drafts = json.data.space_drafts || [];
      const urls = drafts.map((d: any) => `${process.env.NEXT_PUBLIC_SPACE_AI_PAGE_URL || "https://cre-aipage.vercel.app"}${d.next_url}`);
      setSpaceAiUrls(urls);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  if (status === "success") {
    return (
      <div className={`p-4 rounded-lg border border-purple-200 bg-purple-50 ${className}`}>
        <p className="text-sm font-semibold text-purple-800 mb-1">✅ AI 임대 마케팅 시작됨</p>
        <p className="text-xs text-purple-600 mb-3">AI가 공실 임대 페이지 초안을 만들었어요. 사진만 올리면 바로 공유할 수 있어요.</p>
        <div className="space-y-2">
          {spaceAiUrls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition"
            >
              📸 공실 #{i + 1} 임대 페이지 편집하기 →
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={handleTrigger}
        disabled={status === "loading"}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "loading" ? "AI 임대 자료 준비 중..." : "🏢 공실 AI 임대 시작하기"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-600 text-center">{errorMsg}</p>
      )}
    </div>
  );
}
