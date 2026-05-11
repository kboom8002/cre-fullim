"use client";
import { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────
interface Assignment {
  id: string;
  project_id: string;
  section_id?: string;
  expert_role: string;
  assignment_type: string;
  status: string;
  instructions?: string;
  due_at?: string;
  project_title?: string;
  section_title?: string;
  section_risk_level?: string;
}

// ─── Status config ─────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  assigned:           { label: "배정됨",    bg: "#1e293b", color: "#94a3b8" },
  in_review:          { label: "검토 중",   bg: "#1e1b4b", color: "#a5b4fc" },
  submitted:          { label: "제출됨",    bg: "#052e16", color: "#86efac" },
  revision_requested: { label: "재검토 요청", bg: "#451a03", color: "#fdba74" },
  approved:           { label: "승인됨",    bg: "#166534", color: "#bbf7d0" },
  cancelled:          { label: "취소됨",    bg: "#111827", color: "#475569" },
};

const RISK_CFG: Record<string, string> = { low: "#22c55e", medium: "#f97316", high: "#ef4444" };

type FilterMode = "all" | "assigned" | "in_review" | "submitted" | "revision_requested";

// ─── Page ───────────────────────────────────────────────────────────────
export default function ExpertAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/expert/assignments")
      .then(r => r.json())
      .then(r => { if (r.ok) setAssignments(r.data?.assignments ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter(a => filter === "all" || a.status === filter);
  const counts = {
    all: assignments.length,
    assigned: assignments.filter(a => a.status === "assigned").length,
    in_review: assignments.filter(a => a.status === "in_review").length,
    submitted: assignments.filter(a => a.status === "submitted").length,
    revision_requested: assignments.filter(a => a.status === "revision_requested").length,
  };

  return (
    <main style={S.main}>
      <header style={S.header}>
        <div style={S.hRow}>
          <div>
            <h1 style={S.title}>전문가 배정 목록</h1>
            <p style={S.muted}>나에게 배정된 IM 섹션 검토 작업 목록입니다.</p>
          </div>
        </div>
      </header>

      <div style={S.body}>
        {/* Filter bar */}
        <div style={S.filterBar}>
          {(["all", "assigned", "in_review", "submitted", "revision_requested"] as FilterMode[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...S.filterBtn, ...(filter === f ? S.filterBtnActive : {}) }}>
              {f === "all" ? `전체 (${counts.all})` :
               f === "assigned" ? `배정됨 (${counts.assigned})` :
               f === "in_review" ? `검토 중 (${counts.in_review})` :
               f === "submitted" ? `제출됨 (${counts.submitted})` :
               `재검토 (${counts.revision_requested})`}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={S.muted}>로딩 중…</p>
        ) : filtered.length === 0 ? (
          <div style={S.emptyCard}>
            <p style={S.emptyIcon}>📋</p>
            <p style={S.emptyTitle}>배정된 작업이 없습니다.</p>
            <p style={S.muted}>새로운 검토 요청이 들어오면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div style={S.cardGrid}>
            {filtered.map(a => <AssignmentCard key={a.id} assignment={a} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function AssignmentCard({ assignment: a }: { assignment: Assignment }) {
  const cfg = STATUS_CFG[a.status] ?? STATUS_CFG.assigned;
  const riskColor = RISK_CFG[a.section_risk_level ?? "medium"] ?? "#f97316";

  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <span style={{ ...S.badge, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        <span style={{ ...S.riskDot, background: riskColor }} />
        <span style={{ color: riskColor, fontSize: 11 }}>{a.section_risk_level ?? "medium"} risk</span>
        {a.due_at && (
          <span style={S.dueDate}>마감: {new Date(a.due_at).toLocaleDateString("ko-KR")}</span>
        )}
      </div>
      <h3 style={S.cardTitle}>{a.section_title ?? "섹션"}</h3>
      <p style={S.cardProject}>{a.project_title ?? "IM 프로젝트"}</p>
      <div style={S.cardMeta}>
        <span style={S.metaChip}>{a.expert_role.replace(/_/g, " ")}</span>
        <span style={S.metaChip}>{a.assignment_type.replace(/_/g, " ")}</span>
      </div>
      {a.instructions && <p style={S.instructions}>📋 {a.instructions}</p>}
      <a href={`/expert/assignments/${a.id}`} style={S.ctaBtn}>검토 시작 →</a>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" },
  header: { background: "#0d1426", borderBottom: "1px solid #1e293b", padding: "20px 32px" },
  hRow: { maxWidth: 1100, margin: "0 auto" },
  title: { fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#f1f5f9" },
  muted: { color: "#475569", fontSize: 13, margin: 0 },
  body: { maxWidth: 1100, margin: "24px auto", padding: "0 32px" },
  filterBar: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" as const },
  filterBtn: { borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #1e293b", background: "#0d1426", color: "#64748b" },
  filterBtnActive: { background: "#1e293b", color: "#f1f5f9", borderColor: "#3b82f6" },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 },
  card: { background: "#0d1426", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column" as const, gap: 10 },
  cardTop: { display: "flex", alignItems: "center", gap: 8 },
  badge: { borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 },
  riskDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  dueDate: { marginLeft: "auto", fontSize: 11, color: "#64748b" },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  cardProject: { fontSize: 12, color: "#64748b", margin: 0 },
  cardMeta: { display: "flex", gap: 6, flexWrap: "wrap" as const },
  metaChip: { background: "#1e293b", color: "#94a3b8", borderRadius: 4, padding: "2px 8px", fontSize: 11 },
  instructions: { fontSize: 12, color: "#94a3b8", background: "#111827", borderRadius: 6, padding: "8px 10px", margin: 0, lineHeight: 1.5 },
  ctaBtn: { display: "block", textAlign: "center" as const, background: "#2563eb", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none", marginTop: 4 },
  emptyCard: { textAlign: "center" as const, padding: "48px 32px" },
  emptyIcon: { fontSize: 40, margin: "0 0 12px" },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" },
};
