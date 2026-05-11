import { cn } from "@/lib/utils";

// ─── Status Configurations ─────────────────────────────────────────
export const PROJECT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  intake:             { label: "임포트 완료",     className: "status-ai-draft" },
  readiness_checked:  { label: "준비도 완료",     className: "bg-blue-950/60 text-blue-300 border border-blue-800/50" },
  ssot_building:      { label: "SSoT 구성 중",    className: "bg-indigo-950/60 text-indigo-300 border border-indigo-800/50" },
  outline_generated:  { label: "아웃라인 생성",   className: "bg-cyan-950/60 text-cyan-300 border border-cyan-800/50" },
  ai_draft:           { label: "AI 초안 작성 중", className: "status-ai-draft" },
  expert_patch:       { label: "전문가 검토 중",  className: "status-needs-expert" },
  gate_review:        { label: "Gate 검토 중",    className: "status-gate-review" },
  buyer_ready:        { label: "Buyer-ready",     className: "status-buyer-ready" },
  exported:           { label: "내보내기 완료",   className: "status-exported" },
  blocked:            { label: "차단됨",          className: "status-blocked" },
};

export const SECTION_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  planned:            { label: "계획됨",       className: "status-planned" },
  needs_data:         { label: "데이터 부족",  className: "status-needs-data" },
  needs_expert_patch: { label: "전문가 필요",  className: "status-needs-expert" },
  blocked:            { label: "차단됨",       className: "status-blocked" },
  ai_draft:           { label: "AI 초안",      className: "status-ai-draft" },
  patched:            { label: "전문가 반영",  className: "status-patched" },
  buyer_ready:        { label: "Buyer-ready",  className: "status-buyer-ready" },
};

export const EXPERT_ASSIGNMENT_STATUS: Record<string, { label: string; className: string }> = {
  assigned:   { label: "배정됨",    className: "status-needs-expert" },
  in_progress:{ label: "진행 중",   className: "status-ai-draft" },
  submitted:  { label: "제출 완료", className: "status-buyer-ready" },
  approved:   { label: "승인됨",    className: "status-buyer-ready" },
  rejected:   { label: "반려됨",    className: "status-blocked" },
};

export const GOLDEN_STATUS: Record<string, { label: string; className: string }> = {
  candidate: { label: "후보",    className: "status-needs-data" },
  redacted:  { label: "적재완료", className: "status-ai-draft" },
  approved:  { label: "승인됨",  className: "status-buyer-ready" },
  rejected:  { label: "반려됨",  className: "status-blocked" },
};

// ─── Component ─────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
  type?: "project" | "section" | "assignment" | "golden" | "gate" | "risk";
  className?: string;
}

const GATE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pass:           { label: "통과",       className: "status-buyer-ready" },
  revise:         { label: "수정 필요",  className: "status-needs-data" },
  blocked:        { label: "차단됨",     className: "status-blocked" },
  expert_required:{ label: "전문가 필요",className: "status-needs-expert" },
  not_run:        { label: "미실행",     className: "status-planned" },
};

const RISK_CONFIG: Record<string, { label: string; className: string }> = {
  low:     { label: "Low",     className: "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50" },
  medium:  { label: "Medium",  className: "bg-amber-950/60 text-amber-300 border border-amber-800/50" },
  high:    { label: "High",    className: "bg-red-950/60 text-red-300 border border-red-800/50" },
  blocked: { label: "Blocked", className: "status-blocked" },
};

export function StatusBadge({ status, type = "project", className }: StatusBadgeProps) {
  const config =
    type === "section"    ? SECTION_STATUS_CONFIG[status] :
    type === "assignment" ? EXPERT_ASSIGNMENT_STATUS[status] :
    type === "golden"     ? GOLDEN_STATUS[status] :
    type === "gate"       ? GATE_STATUS_CONFIG[status] :
    type === "risk"       ? RISK_CONFIG[status] :
    PROJECT_STATUS_CONFIG[status];

  const cfg = config ?? { label: status, className: "status-planned" };

  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
      cfg.className,
      className
    )}>
      {cfg.label}
    </span>
  );
}
