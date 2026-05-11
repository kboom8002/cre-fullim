"use client";
import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { ChevronRight, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  PATCH_TYPES, EDIT_TAGS, TRAINING_RIGHTS, VISIBILITY_OPTIONS,
  type ExpertPatchSubmit,
} from "@/domain/expert/expert-patch";

// ─── Types ─────────────────────────────────────────────────────────────
interface AssignmentDetail {
  id: string;
  project_id: string;
  section_id?: string;
  expert_role: string;
  assignment_type: string;
  status: string;
  instructions?: string;
  due_at?: string;
  section_title?: string;
  section_markdown?: string;
  section_risk_level?: string;
  section_confidence?: string;
  section_missing_data?: string[];
}

const VISIBILITY_LABELS: Record<string, string> = {
  internal_only:   "내부 전용 (외부 공유 불가)",
  gate_restricted: "Gate 통과 후 공유 가능",
  buyer_ready:     "매수자 공유 가능 (최종 승인 필요)",
  blocked:         "공유 불가 (차단)",
};

const TRAINING_LABELS: Record<string, string> = {
  not_allowed:                "사용 불가",
  allowed_anonymized:         "비식별 처리 후 허용",
  allowed_internal_eval_only: "내부 평가 한정 허용",
  allowed_golden_dataset:     "골든 데이터셋 포함 허용",
};

const RISK_BADGE: Record<string, string> = {
  low: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50",
  medium: "bg-amber-950/60 text-amber-300 border-amber-800/50",
  high: "bg-red-950/60 text-red-300 border-red-800/50",
};

// ─── Page ───────────────────────────────────────────────────────────────
export default function AssignmentWorkbenchPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [patchType, setPatchType] = useState<string>("risk_balance");
  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [rationale, setRationale] = useState("");
  const [visibility, setVisibility] = useState<string>("internal_only");
  const [trainingRights, setTrainingRights] = useState<string>("not_allowed");
  const [requiresReview, setRequiresReview] = useState(false);

  useEffect(() => {
    if (!assignmentId) return;
    fetch(`/api/expert/assignments/${assignmentId}`)
      .then(r => r.json())
      .then(r => { if (r.ok) setAssignment(r.data); })
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const toggleTag = useCallback((tag: string) => {
    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!assignmentId || !assignment) return;
    if (!afterText.trim()) { setError("수정 후 내용(after_text)을 입력해주세요."); return; }
    if (editTags.length === 0) { setError("편집 태그를 최소 1개 선택해주세요."); return; }
    setSubmitting(true);
    setError(null);
    const toastId = toast.loading("패치를 제출하는 중…");
    try {
      const payload: ExpertPatchSubmit = {
        assignment_id: assignmentId,
        project_id: assignment.project_id,
        section_id: assignment.section_id,
        expert_role: assignment.expert_role as ExpertPatchSubmit["expert_role"],
        patch_type: patchType as ExpertPatchSubmit["patch_type"],
        before_text: beforeText || undefined,
        after_text: afterText,
        edit_tags: editTags as ExpertPatchSubmit["edit_tags"],
        rationale: rationale || undefined,
        visibility_after_review: visibility as ExpertPatchSubmit["visibility_after_review"],
        training_rights: trainingRights as ExpertPatchSubmit["training_rights"],
        requires_additional_review: requiresReview,
      };
      const r = await fetch(`/api/expert-patches/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j.ok) {
        toast.success("패치가 성공적으로 제출되었습니다!", { id: toastId });
        setSubmitted(true);
      } else {
        const msg = j.message ?? "제출에 실패했습니다.";
        setError(msg);
        toast.error(msg, { id: toastId });
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  }, [assignmentId, assignment, patchType, beforeText, afterText, editTags, rationale, visibility, trainingRights, requiresReview]);

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton type="page-header" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><LoadingSkeleton type="section-row" rows={4} /></div>
          <LoadingSkeleton type="card" rows={1} />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
        <CheckCircle2 className="h-16 w-16 text-emerald-400 mb-6" />
        <h2 className="text-2xl font-bold text-foreground mb-2">패치가 제출되었습니다</h2>
        <p className="text-muted-foreground mb-8">검토자가 검토 후 결과를 알려드립니다.</p>
        <Button asChild>
          <Link href="/expert/assignments">← 배정 목록으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/expert/assignments" className="hover:text-foreground">전문가 배정</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{assignment?.section_title ?? "섹션 검토"}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-foreground">
            {assignment?.section_title ?? "섹션 검토"}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={assignment?.status ?? "assigned"} type="assignment" />
            <Badge variant="outline" className="text-violet-300 border-violet-800/50">
              {assignment?.expert_role?.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {assignment?.assignment_type?.replace(/_/g, " ")}
            </Badge>
            {assignment?.due_at && (
              <span className="text-xs text-muted-foreground">
                마감: {new Date(assignment.due_at).toLocaleDateString("ko-KR")}
              </span>
            )}
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={submitting} id="btn-submit-patch">
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "제출 중…" : "패치 제출"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT 3/5: Current section content */}
        <section className="lg:col-span-3 space-y-4">
          {/* Instructions */}
          {assignment?.instructions && (
            <div className="rounded-xl border border-violet-800/40 bg-violet-950/20 p-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-400">검토 요청 사유</p>
              <p className="text-sm text-violet-200 leading-relaxed">{assignment.instructions}</p>
            </div>
          )}

          {/* AI Draft */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">현재 AI 초안</span>
              {assignment?.section_risk_level && (
                <span className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                  RISK_BADGE[assignment.section_risk_level]
                )}>
                  {assignment.section_risk_level} risk
                </span>
              )}
            </div>
            <pre className="text-sm text-muted-foreground leading-relaxed p-4 whitespace-pre-wrap font-sans max-h-80 overflow-y-auto">
              {assignment?.section_markdown ?? "AI 초안이 아직 없습니다."}
            </pre>
          </div>

          {/* Missing data */}
          {(assignment?.section_missing_data?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> 누락 데이터
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assignment!.section_missing_data!.map(m => (
                  <span key={m} className="rounded-md border border-amber-800/40 bg-amber-950/40 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT 2/5: Patch form */}
        <aside className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-5">
            <h2 className="text-sm font-bold text-foreground">전문가 패치 작성</h2>
            <Separator />

            {/* Patch type */}
            <div className="space-y-1.5">
              <Label className="text-xs">패치 유형 *</Label>
              <Select value={patchType} onValueChange={(v) => v && setPatchType(v)}>
                <SelectTrigger className="h-9 text-xs" id="patch-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATCH_TYPES.map(pt => (
                    <SelectItem key={pt} value={pt} className="text-xs">{pt.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Before text */}
            <div className="space-y-1.5">
              <Label className="text-xs">수정 전 내용 <span className="text-muted-foreground">(선택)</span></Label>
              <Textarea
                value={beforeText}
                onChange={e => setBeforeText(e.target.value)}
                placeholder="원래 표현을 붙여넣으세요…"
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            {/* After text */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                수정 후 내용 <span className="text-destructive">* (필수)</span>
              </Label>
              <Textarea
                value={afterText}
                onChange={e => setAfterText(e.target.value)}
                placeholder="수정된 표현을 입력하세요…"
                rows={5}
                className={cn("text-xs resize-none", !afterText && "border-destructive")}
                id="after-text-input"
              />
            </div>

            {/* Edit tags */}
            <div className="space-y-2">
              <Label className="text-xs">
                편집 태그 <span className="text-destructive">* (최소 1개)</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {EDIT_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors",
                      editTags.includes(tag)
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tag.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Rationale */}
            <div className="space-y-1.5">
              <Label className="text-xs">수정 이유 <span className="text-muted-foreground">(권장)</span></Label>
              <Textarea
                value={rationale}
                onChange={e => setRationale(e.target.value)}
                placeholder="왜 이 수정이 필요한지 설명해주세요."
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <Label className="text-xs">검토 후 공개 범위 *</Label>
              <Select value={visibility} onValueChange={(v) => v && setVisibility(v)}>
                <SelectTrigger className="h-9 text-xs" id="visibility-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map(v => (
                    <SelectItem key={v} value={v} className="text-xs">{VISIBILITY_LABELS[v] ?? v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">※ 최종 공개 여부는 검토자가 결정합니다.</p>
            </div>

            {/* Training rights */}
            <div className="space-y-1.5">
              <Label className="text-xs">AI 학습 데이터 사용 동의 *</Label>
              <Select value={trainingRights} onValueChange={(v) => v && setTrainingRights(v)}>
                <SelectTrigger className="h-9 text-xs" id="training-rights-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_RIGHTS.map(tr => (
                    <SelectItem key={tr} value={tr} className="text-xs">{TRAINING_LABELS[tr] ?? tr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Requires review */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires-review"
                checked={requiresReview}
                onChange={e => setRequiresReview(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border bg-muted"
              />
              <Label htmlFor="requires-review" className="text-xs cursor-pointer">
                추가 검토자 검토 필요
              </Label>
            </div>

            <Separator />

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              id="btn-submit-patch-bottom"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "제출 중…" : "패치 제출"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
