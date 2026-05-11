"use client";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ReadinessScoreCardProps {
  score: number;
  note?: string;
  className?: string;
}

const SCORE_BAND = (s: number) => {
  if (s <= 30) return { label: "Teaser 전용", color: "text-red-400", trackColor: "bg-red-500" };
  if (s <= 50) return { label: "External Snapshot 후보", color: "text-orange-400", trackColor: "bg-orange-500" };
  if (s <= 70) return { label: "IM Lite 후보", color: "text-amber-400", trackColor: "bg-amber-500" };
  if (s <= 85) return { label: "Full IM Draft 가능", color: "text-emerald-400", trackColor: "bg-emerald-500" };
  return { label: "Buyer-ready 후보 (Gate 필요)", color: "text-blue-400", trackColor: "bg-blue-500" };
};

export function ReadinessScoreCard({ score, note, className }: ReadinessScoreCardProps) {
  const band = SCORE_BAND(score);
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-5 space-y-4",
      className
    )}>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">준비도 점수</p>
      <div className="flex items-baseline gap-3">
        <span className={cn("text-5xl font-black tabular-nums", band.color)}>{score}</span>
        <span className="text-xl text-muted-foreground">/100</span>
        <span className={cn(
          "ml-2 rounded-full px-3 py-1 text-xs font-semibold",
          "bg-muted/60 border border-border",
          band.color
        )}>
          {band.label}
        </span>
      </div>
      <Progress value={score} className="h-2" />
      {note && (
        <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
      )}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, className }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-5",
      className
    )}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-black tabular-nums text-foreground">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
