"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ChevronRight, PlayCircle, FileText, ShieldCheck,
  Download, Users, LayoutGrid, Zap, TrendingUp, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReadinessScoreCard } from "@/components/ui/DomainCards";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  ReadinessResult,
  ExpertPatchRecommendation,
} from "@/domain/readiness/readiness-service";

// ─── Types ────────────────────────────────────────────────────────────
interface Project {
  id: string;
  status: string;
  readiness_score: number | null;
  project_type: string;
  target_output: string;
  title: string | null;
  created_at: string;
}

// ─── Quick action cards ───────────────────────────────────────────────
const QUICK_ACTIONS = [
  { href: "sections", icon: <LayoutGrid className="h-4 w-4" />, label: "18-섹션 아웃라인", desc: "섹션 생성 및 AI 초안", color: "text-blue-400 bg-blue-950/40 border-blue-800/50" },
  { href: "gate-review", icon: <ShieldCheck className="h-4 w-4" />, label: "Gate 검토", desc: "공시·리스크 검증", color: "text-amber-400 bg-amber-950/40 border-amber-800/50" },
  { href: "export", icon: <Download className="h-4 w-4" />, label: "내보내기", desc: "IM 문서 다운로드", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50" },
  { href: "bssot", icon: <FileText className="h-4 w-4" />, label: "B-SSoT 레이어", desc: "데이터 소스 확인", color: "text-violet-400 bg-violet-950/40 border-violet-800/50" },
  { href: "qna-pack", icon: <TrendingUp className="h-4 w-4" />, label: "Q&A Pack", desc: "딜룸 Q&A 생성", color: "text-cyan-400 bg-cyan-950/40 border-cyan-800/50" },
];

const OUTPUT_LABELS: Record<string, string> = {
  blind_teaser: "Blind Teaser",
  external_snapshot: "External Snapshot",
  im_lite: "IM Lite",
  full_im_draft: "Full IM Draft",
  buyer_ready_full_im: "Buyer-ready Full IM",
};

// ─── Page ─────────────────────────────────────────────────────────────
export default function IMProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/im-projects/${id}/bssot`)
      .then(r => r.json())
      .then(r => {
        if (r.ok) setProject({ ...r.data.bssot_full, ...r.data } as unknown as Project);
        else toast.error("프로젝트를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const runReadiness = useCallback(async () => {
    if (!id) return;
    setChecking(true);
    const toastId = toast.loading("준비도 검토 실행 중…");
    try {
      const r = await fetch(`/api/im-projects/${id}/readiness-check`, { method: "POST" });
      const json = await r.json();
      if (json.ok) {
        setReadiness(json.data);
        toast.success("준비도 검토가 완료되었습니다.", { id: toastId });
      } else {
        toast.error(json.message ?? "준비도 검토 실패", { id: toastId });
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.", { id: toastId });
    } finally {
      setChecking(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton type="page-header" />
        <LoadingSkeleton type="stat" />
        <LoadingSkeleton type="card" rows={3} />
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/im-projects" className="hover:text-foreground transition-colors">IM 프로젝트</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {project?.title ?? id}
        </span>
      </nav>

      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{project?.title ?? "IM 프로젝트"}</h1>
            <StatusBadge status={project?.status ?? "intake"} type="project" />
          </div>
          <p className="text-xs text-muted-foreground font-mono">{id}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{project?.project_type?.replace(/_/g, " ")}</span>
            <span className="text-border">·</span>
            <span>{project?.target_output?.replace(/_/g, " ")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={runReadiness}
            disabled={checking}
            id="btn-run-readiness"
          >
            <PlayCircle className={cn("h-3.5 w-3.5 mr-1.5", checking && "animate-spin")} />
            {checking ? "검토 중…" : "Readiness 실행"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main layout: 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Readiness + Quick Actions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Readiness Card */}
          {readiness ? (
            <ReadinessScoreCard
              score={readiness.readiness_score}
              note={readiness.boundary_note}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
              <div className="text-3xl">📊</div>
              <p className="text-sm font-medium text-foreground">준비도 검토를 아직 실행하지 않았습니다</p>
              <p className="text-xs text-muted-foreground">
                Readiness 실행 버튼을 클릭하면 데이터 품질, 섹션 가용성, 전문가 필요 영역을 자동으로 분석합니다.
              </p>
              <Button size="sm" onClick={runReadiness} disabled={checking}>
                <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
                {checking ? "검토 중…" : "Readiness 실행"}
              </Button>
            </div>
          )}

          {/* Output Availability Matrix */}
          {readiness && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">출력 가용성</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[...readiness.available_outputs, ...readiness.blocked_outputs].map((out) => {
                  const avail = readiness.available_outputs.includes(out);
                  return (
                    <div
                      key={out}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-medium flex items-center gap-2",
                        avail
                          ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-300"
                          : "border-border bg-muted/20 text-muted-foreground"
                      )}
                    >
                      <span>{avail ? "✓" : "✗"}</span>
                      <span>{OUTPUT_LABELS[out] ?? out}</span>
                    </div>
                  );
                })}
              </div>
              {readiness.missing_required_data.length > 0 && (
                <div className="pt-2 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    필수 누락 데이터
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {readiness.missing_required_data.map(m => (
                      <span key={m} className="rounded-md border border-amber-800/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">작업 메뉴</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_ACTIONS.map(action => (
                <Link key={action.href} href={`/im-projects/${id}/${action.href}`}>
                  <div className={cn(
                    "rounded-xl border p-4 flex items-center gap-3",
                    "hover:opacity-80 transition-opacity cursor-pointer",
                    action.color
                  )}>
                    <div>{action.icon}</div>
                    <div>
                      <p className="text-sm font-semibold">{action.label}</p>
                      <p className="text-[10px] opacity-70">{action.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar: Expert patches + Section progress */}
        <div className="space-y-5">
          {readiness && readiness.required_expert_patches.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">전문가 검토 필요</p>
                <span className="text-xs font-bold text-amber-400">{readiness.required_expert_patches.length}건</span>
              </div>
              <div className="space-y-2">
                {readiness.required_expert_patches.map((patch: ExpertPatchRecommendation, i: number) => (
                  <div key={i} className="rounded-lg bg-muted/30 border border-border p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        patch.priority === "high" ? "bg-red-400" :
                        patch.priority === "medium" ? "bg-amber-400" : "bg-muted-foreground"
                      )} />
                      <span className="text-xs font-mono text-blue-300 flex-1 truncate">
                        {patch.section_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-violet-400 font-semibold">
                        {patch.expert_role.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{patch.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {readiness && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">섹션 현황</p>
              {(["ready", "partial", "blocked"] as const).map(st => {
                const count = readiness.section_readiness.filter(s => s.status === st).length;
                const color = st === "ready" ? "bg-emerald-500" : st === "partial" ? "bg-amber-500" : "bg-red-500";
                const textColor = st === "ready" ? "text-emerald-400" : st === "partial" ? "text-amber-400" : "text-red-400";
                const label = st === "ready" ? "준비됨" : st === "partial" ? "부분 완료" : "차단됨";
                return (
                  <div key={st} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={cn("font-bold tabular-nums", textColor)}>{count}</span>
                    </div>
                    <Progress value={(count / 18) * 100} className="h-1" />
                  </div>
                );
              })}
              <Link href={`/im-projects/${id}/sections`} className="block mt-2">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <LayoutGrid className="h-3 w-3 mr-1.5" />
                  전체 섹션 보기
                </Button>
              </Link>
            </div>
          )}

          {/* Project Info */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">프로젝트 정보</p>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">상태</dt>
                <dd><StatusBadge status={project?.status ?? "intake"} type="project" /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">유형</dt>
                <dd className="text-foreground">{project?.project_type ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">목표 출력</dt>
                <dd className="text-foreground">{project?.target_output?.replace(/_/g, " ") ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ID</dt>
                <dd className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">{id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
