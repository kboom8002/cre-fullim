"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Upload, Search, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Project {
  id: string;
  status: string;
  readiness_score: number | null;
  project_type: string;
  target_output: string;
  title: string | null;
  created_at: string;
  created_by: string;
}

const STATUS_ORDER = [
  "intake", "readiness_checked", "outline_generated", "ai_draft",
  "expert_patch", "gate_review", "buyer_ready", "exported", "blocked"
];

type FilterStatus = "all" | string;

export default function IMProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const loadProjects = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/im-projects");
      const json = await r.json();
      if (json.ok) {
        setProjects(json.data ?? []);
      } else {
        // Fallback to admin projects API
        const r2 = await fetch("/api/admin/projects");
        const j2 = await r2.json();
        if (j2.ok) setProjects(j2.data ?? []);
      }
    } catch {
      toast.error("프로젝트 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const filtered = projects.filter(p => {
    const matchSearch = !search ||
      (p.title?.toLowerCase().includes(search.toLowerCase())) ||
      p.id.includes(search);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">IM 프로젝트</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "…" : `총 ${projects.length}개 프로젝트`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadProjects} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            새로고침
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/im-projects/import">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              핸드오프 가져오기
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Filter Chips */}
      {!loading && projects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
              filterStatus === "all"
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
            )}
          >
            전체 ({projects.length})
          </button>
          {STATUS_ORDER.filter(s => statusCounts[s]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
                filterStatus === s
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <StatusBadge status={s} type="project" />
              <span className="ml-1.5">{statusCounts[s]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {!loading && projects.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="프로젝트 검색…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="card" rows={6} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="아직 IM 프로젝트가 없습니다"
          description="MVP에서 핸드오프 데이터를 가져오거나 직접 프로젝트를 시작하세요."
          action={
            <Button asChild>
              <Link href="/im-projects/import">
                <Upload className="h-4 w-4 mr-2" />
                핸드오프 가져오기
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="검색 결과가 없습니다"
          description="검색어나 필터를 변경해 보세요."
          action={
            <Button variant="outline" onClick={() => { setSearch(""); setFilterStatus("all"); }}>
              필터 초기화
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const score = project.readiness_score ?? 0;
  const scoreColor = score > 85 ? "text-blue-400" : score > 70 ? "text-emerald-400" : score > 50 ? "text-amber-400" : "text-orange-400";

  return (
    <Link href={`/im-projects/${project.id}`} className="group block">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 
        hover:border-primary/40 hover:bg-card/80 transition-all duration-200 
        group-hover:shadow-[0_0_20px_oklch(0.60_0.20_250/15%)]">
        
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {project.title ?? `IM 프로젝트`}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">
              {project.id}
            </p>
          </div>
          <StatusBadge status={project.status} type="project" className="flex-shrink-0" />
        </div>

        {/* Readiness score */}
        {project.readiness_score !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">준비도</span>
              <span className={cn("text-sm font-black tabular-nums", scoreColor)}>{score}</span>
            </div>
            <Progress value={score} className="h-1.5" />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{project.target_output?.replace(/_/g, " ")}</span>
          <span>
            {formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: ko })}
          </span>
        </div>
      </div>
    </Link>
  );
}
