"use client";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  type?: "card" | "table" | "stat" | "section-row" | "page-header" | "list";
  rows?: number;
  className?: string;
}

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded", className)} />;
}

const WIDTHS = ["w-10", "w-28", "w-20", "w-20", "w-20", "w-16"];

export function LoadingSkeleton({ type = "card", rows = 3, className }: LoadingSkeletonProps) {
  if (type === "stat") {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-5 space-y-3">
            <Pulse className="h-3 w-24" />
            <Pulse className="h-8 w-16" />
            <Pulse className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="rounded-t-xl border border-border bg-muted/30 px-4 py-3 flex gap-4">
          {WIDTHS.map((w, i) => (
            <Pulse key={i} className={cn("h-3", w)} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-x border-b border-border px-4 py-4 flex gap-4 items-center">
            {WIDTHS.map((w, j) => (
              <Pulse key={j} className={cn("h-3 rounded", w)} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === "section-row") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 flex items-center gap-4">
            <Pulse className="h-5 w-5 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-4 w-48" />
              <Pulse className="h-3 w-32" />
            </div>
            <Pulse className="h-5 w-16 rounded-full" />
            <Pulse className="h-5 w-12 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "page-header") {
    return (
      <div className={cn("space-y-3", className)}>
        <Pulse className="h-4 w-24" />
        <Pulse className="h-7 w-64" />
        <div className="flex gap-2 pt-1">
          <Pulse className="h-5 w-20 rounded-full" />
          <Pulse className="h-5 w-24 rounded-full" />
        </div>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Pulse className="h-4 w-4 rounded-full flex-shrink-0" />
            <Pulse className={cn("h-3 flex-1", i % 2 === 0 ? "max-w-[60%]" : "max-w-[80%]")} />
          </div>
        ))}
      </div>
    );
  }

  // Default: card grid
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Pulse className="h-4 w-32" />
              <Pulse className="h-3 w-20" />
            </div>
            <Pulse className="h-5 w-16 rounded-full" />
          </div>
          <Pulse className="h-2 w-full rounded-full" />
          <div className="space-y-2">
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
