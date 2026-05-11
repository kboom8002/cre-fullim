"use client";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, className, compact = false }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-12 px-6" : "py-24 px-8",
      className
    )}>
      {icon && (
        <div className={cn("mb-4", compact ? "text-4xl" : "text-6xl")}>
          {icon}
        </div>
      )}
      <h3 className={cn("font-semibold text-foreground", compact ? "text-base mb-1" : "text-lg mb-2")}>
        {title}
      </h3>
      {description && (
        <p className={cn("text-muted-foreground max-w-sm leading-relaxed", compact ? "text-xs mb-4" : "text-sm mb-6")}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
