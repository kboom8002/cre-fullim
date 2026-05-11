"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw, CheckCircle2, XCircle, Eye, ShieldX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Candidate {
  id: string;
  project_id: string;
  section_type: string | null;
  edit_tags: string[];
  training_rights: string;
  redaction_status: string;
  review_status: string;
  created_at: string;
}

const TRAINING_LABELS: Record<string, string> = {
  not_allowed: "사용 불가",
  allowed_anonymized: "비식별 허용",
  allowed_internal_eval_only: "내부 평가 한정",
  allowed_golden_dataset: "Golden Dataset",
};

export default function GoldenCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/golden-im-candidates");
      const json = await r.json();
      if (json.ok) setCandidates(json.data ?? []);
    } catch {
      toast.error("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAction = async (id: string, action: "redact" | "approve" | "reject", body?: object) => {
    setActionLoading(`${id}-${action}`);
    try {
      const r = await fetch(`/api/golden-im-candidates/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await r.json();
      if (json.ok) {
        toast.success(`${action === "redact" ? "적재" : action === "approve" ? "승인" : "반려"}이 완료되었습니다.`);
        await load();
      } else {
        toast.error(json.message ?? `${action} 실패`);
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
      setRejectReason("");
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Golden Dataset</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Golden Dataset 후보</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "…" : `총 ${candidates.length}개 후보`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          새로고침
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Golden Dataset 후보가 없습니다"
          description="전문가 패치를 Golden Dataset 후보로 등록하면 여기에 표시됩니다."
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["섹션 유형", "학습 권한", "편집 태그", "적재 상태", "검토 상태", "등록일", "액션"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <tr key={c.id} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "bg-card" : "bg-muted/10")}>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-blue-300">{c.section_type ?? "—"}</p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">{c.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[10px] font-semibold rounded-md border px-2 py-0.5",
                      c.training_rights === "allowed_golden_dataset"
                        ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-300"
                        : "border-border bg-muted text-muted-foreground"
                    )}>
                      {TRAINING_LABELS[c.training_rights] ?? c.training_rights}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.edit_tags.slice(0, 2).map(t => (
                        <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                          {t.replace(/_/g, " ")}
                        </Badge>
                      ))}
                      {c.edit_tags.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{c.edit_tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={c.redaction_status === "redacted" ? "buyer_ready" : c.redaction_status === "pending" ? "needs_data" : "planned"}
                      type="project"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.review_status} type="golden" />
                  </td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ko })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {c.redaction_status === "pending" && c.review_status === "candidate" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          disabled={!!actionLoading}
                          onClick={() => runAction(c.id, "redact")}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          적재
                        </Button>
                      )}
                      {c.redaction_status === "redacted" && c.review_status === "candidate" && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 px-2 text-[11px] bg-emerald-800 hover:bg-emerald-700"
                            disabled={!!actionLoading}
                            onClick={() => runAction(c.id, "approve")}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-[11px]"
                            disabled={!!actionLoading}
                            onClick={() => { setRejectTarget(c.id); setRejectReason(""); }}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            반려
                          </Button>
                        </>
                      )}
                      {(c.review_status === "approved" || c.review_status === "rejected") && (
                        <span className="text-[10px] text-muted-foreground">처리 완료</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setRejectTarget(null); setRejectReason(""); }} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl mx-4">
            <button
              onClick={() => { setRejectTarget(null); setRejectReason(""); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-4">Golden Dataset 후보 반려</h3>
            <div className="space-y-2 mb-4">
              <Label className="text-sm">반려 사유 * (필수)</Label>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="반려 사유를 상세히 입력하세요. 이 내용은 감사 추적에 기록됩니다."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>취소</Button>
              <Button
                variant="destructive"
                disabled={!rejectReason.trim() || !!actionLoading}
                onClick={() => rejectTarget && runAction(rejectTarget, "reject", { reason: rejectReason })}
              >
                <ShieldX className="h-4 w-4 mr-2" />
                반려 확정
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
