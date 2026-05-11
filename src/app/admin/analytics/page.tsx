"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ChevronRight, BarChart3, ShieldAlert, Activity, Star, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/DomainCards";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface AnalyticsData {
  total_events: number;
  event_counts: Record<string, number>;
  safety_events: number;
  last_event_at: string | null;
  recent_events: Array<{
    event_type: string;
    occurred_at: string;
    source_app: string;
  }>;
  totals: {
    projects: number;
    expert_assignments: number;
    golden_candidates: number;
  };
  period_days: number;
}

const SAFETY_EVENTS = [
  "gate_review_blocked", "disclosure_violation", "im_export_blocked",
  "buyer_ready_blocked", "golden_candidate_rejected"
];

const EVENT_LABELS: Record<string, string> = {
  handoff_imported: "핸드오프 임포트",
  im_project_created: "프로젝트 생성",
  readiness_checked: "준비도 검토",
  outline_generated: "아웃라인 생성",
  ai_draft_generated: "AI 초안 생성",
  expert_patch_submitted: "전문가 패치 제출",
  gate_review_completed: "Gate 검토 완료",
  buyer_ready_approved: "Buyer-ready 승인",
  im_exported: "IM 내보내기",
  golden_candidate_created: "Golden 후보 생성",
  golden_candidate_approved: "Golden 후보 승인",
  im_export_blocked: "내보내기 차단",
  gate_review_blocked: "Gate 차단",
  disclosure_violation: "공시 위반",
};

const EVENT_COLORS: Record<string, string> = {
  handoff_imported: "bg-blue-500",
  im_project_created: "bg-cyan-500",
  ai_draft_generated: "bg-indigo-500",
  expert_patch_submitted: "bg-violet-500",
  gate_review_completed: "bg-amber-500",
  buyer_ready_approved: "bg-emerald-500",
  im_exported: "bg-teal-500",
  im_export_blocked: "bg-red-500",
  gate_review_blocked: "bg-red-600",
  disclosure_violation: "bg-rose-600",
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/analytics?days=${days}`);
      const json = await r.json();
      if (json.ok) setData(json.data);
      else toast.error(json.message ?? "Analytics 로드 실패");
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  const safetyCount = data ? Object.entries(data.event_counts)
    .filter(([k]) => SAFETY_EVENTS.includes(k))
    .reduce((s, [, v]) => s + v, 0) : 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Analytics</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Console
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `최근 ${days}일 이벤트 분석` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {([7, 30, 90] as const).map(d => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}일
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <LoadingSkeleton type="stat" />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="전체 이벤트" value={data.total_events} icon="⚡" subtitle={`최근 ${days}일`} />
            <StatCard title="IM 프로젝트" value={data.totals.projects} icon="📁" />
            <StatCard title="전문가 배정" value={data.totals.expert_assignments} icon="👥" />
            <StatCard
              title="Safety 이벤트"
              value={safetyCount}
              icon="🛡️"
              subtitle={safetyCount > 0 ? "확인 필요" : "이상 없음"}
            />
          </div>

          <Tabs defaultValue="events">
            <TabsList>
              <TabsTrigger value="events"><Activity className="h-3.5 w-3.5 mr-1.5" />이벤트 분포</TabsTrigger>
              <TabsTrigger value="safety"><ShieldAlert className="h-3.5 w-3.5 mr-1.5" />Safety 이벤트</TabsTrigger>
              <TabsTrigger value="recent"><Star className="h-3.5 w-3.5 mr-1.5" />최근 활동</TabsTrigger>
            </TabsList>

            {/* Event Distribution */}
            <TabsContent value="events" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">이벤트 유형별 발생 수</p>
                {Object.entries(data.event_counts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([eventType, count]) => {
                    const maxCount = Math.max(...Object.values(data.event_counts));
                    const pct = (count / maxCount) * 100;
                    const isSafety = SAFETY_EVENTS.includes(eventType);
                    return (
                      <div key={eventType} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn("font-medium", isSafety ? "text-red-400" : "text-foreground")}>
                            {EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ")}
                            {isSafety && " ⚠️"}
                          </span>
                          <span className="font-bold tabular-nums text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", isSafety ? "bg-red-500" : (EVENT_COLORS[eventType] ?? "bg-primary"))}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>

            {/* Safety Events */}
            <TabsContent value="safety" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-5">
                {safetyCount === 0 ? (
                  <EmptyState icon="✅" title="Safety 이벤트가 없습니다" description="기간 내 공시 위반 또는 차단 이벤트가 발생하지 않았습니다." compact />
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-400">
                      Safety 이벤트 ({safetyCount}건)
                    </p>
                    {SAFETY_EVENTS.map(evt => {
                      const count = data.event_counts[evt] ?? 0;
                      if (!count) return null;
                      return (
                        <div key={evt} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-sm text-red-300">{EVENT_LABELS[evt] ?? evt}</span>
                          <span className="text-sm font-bold text-red-400">{count}건</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Recent Activity */}
            <TabsContent value="recent" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-5">
                {(!data.recent_events || data.recent_events.length === 0) ? (
                  <EmptyState icon="📋" title="최근 활동이 없습니다" compact />
                ) : (
                  <div className="space-y-3">
                    {data.recent_events.map((evt, i) => {
                      const isSafety = SAFETY_EVENTS.includes(evt.event_type);
                      return (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            isSafety ? "bg-red-500" : (EVENT_COLORS[evt.event_type] ?? "bg-primary")
                          )} />
                          <span className={cn("text-sm flex-1", isSafety ? "text-red-300" : "text-foreground")}>
                            {EVENT_LABELS[evt.event_type] ?? evt.event_type}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(evt.occurred_at), { addSuffix: true, locale: ko })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <EmptyState icon="📊" title="Analytics 데이터를 불러오지 못했습니다." />
      )}
    </div>
  );
}
