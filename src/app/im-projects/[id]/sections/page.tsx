"use client";
import { useEffect, useState, useCallback } from "react";
import type { SectionPlan } from "@/domain/sections/section-planner";

// ─── Types ────────────────────────────────────────────────────────────
interface Section extends SectionPlan {
  id?: string;
}

type FilterMode = "all" | "needs_data" | "needs_expert_patch" | "blocked";

// ─── Badge config ─────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  planned:            { label: "계획됨",       bg: "#1e293b", color: "#94a3b8" },
  needs_data:         { label: "데이터 부족",  bg: "#451a03", color: "#fdba74" },
  needs_expert_patch: { label: "전문가 필요",  bg: "#1e1b4b", color: "#a5b4fc" },
  blocked:            { label: "차단됨",       bg: "#450a0a", color: "#fca5a5" },
  ai_draft:           { label: "AI 초안",      bg: "#052e16", color: "#86efac" },
  buyer_ready:        { label: "매수자용 완료", bg: "#166534", color: "#bbf7d0" },
};

const CONFIDENCE_CFG: Record<string, { label: string; color: string }> = {
  confirmed:      { label: "확인됨",     color: "#22c55e" },
  inferred:       { label: "추론됨",     color: "#f97316" },
  needs_evidence: { label: "증거 필요",  color: "#eab308" },
  expert_required:{ label: "전문가 필요",color: "#818cf8" },
  unknown:        { label: "미확인",     color: "#475569" },
};

const RISK_CFG: Record<string, { color: string }> = {
  low:     { color: "#22c55e" },
  medium:  { color: "#f97316" },
  high:    { color: "#ef4444" },
  blocked: { color: "#6b7280" },
};

// ─── Page ─────────────────────────────────────────────────────────────
export default function SectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { params.then(({ id }) => setId(id)); }, [params]);

  const loadSections = useCallback(async (projectId: string) => {
    const r = await fetch(`/api/im-projects/${projectId}/generate-outline`);
    const json = await r.json();
    if (json.ok) setSections(json.data.sections ?? []);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadSections(id).finally(() => setLoading(false));
  }, [id, loadSections]);

  const generateOutline = useCallback(async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const r = await fetch(`/api/im-projects/${id}/generate-outline`, { method: "POST" });
      const json = await r.json();
      if (json.ok) await loadSections(id);
      else setError(json.message ?? "오류");
    } finally {
      setGenerating(false);
    }
  }, [id, loadSections]);

  const filtered = sections.filter((s) => filter === "all" || s.status === filter);

  // Status counts
  const counts = {
    all: sections.length,
    planned: sections.filter((s) => s.status === "planned").length,
    needs_data: sections.filter((s) => s.status === "needs_data").length,
    needs_expert_patch: sections.filter((s) => s.status === "needs_expert_patch").length,
    blocked: sections.filter((s) => s.status === "blocked").length,
  };

  if (loading) return <div style={S.center}><p style={S.muted}>섹션 로딩 중…</p></div>;

  return (
    <main style={S.main}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.hRow}>
          <div>
            <a href={`/im-projects/${id}`} style={S.back}>← 대시보드</a>
            <h1 style={S.title}>18-섹션 Full IM 아웃라인</h1>
            {sections.length > 0 && (
              <div style={S.countRow}>
                {(["planned", "needs_data", "needs_expert_patch", "blocked"] as const).map((st) => (
                  <span key={st} style={{ ...S.countChip, ...statusChipStyle(st) }}>
                    {STATUS_CFG[st]?.label}: {counts[st]}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={S.actions}>
            <button
              onClick={generateOutline}
              disabled={generating}
              style={{ ...S.btn, ...S.btnPrimary }}
              id="btn-generate-outline"
            >
              {generating ? "생성 중…" : sections.length > 0 ? "↺ 아웃라인 재생성" : "▶ 아웃라인 생성"}
            </button>
          </div>
        </div>
      </header>

      {error && <div style={S.errorBanner}>{error}</div>}

      {sections.length === 0 ? (
        <EmptyState onGenerate={generateOutline} generating={generating} />
      ) : (
        <div style={S.body}>
          {/* Filter bar */}
          <div style={S.filterBar}>
            {(["all", "needs_data", "needs_expert_patch", "blocked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ ...S.filterBtn, ...(filter === f ? S.filterBtnActive : {}) }}
              >
                {f === "all" ? `전체 (${counts.all})` :
                 f === "needs_data" ? `데이터 부족 (${counts.needs_data})` :
                 f === "needs_expert_patch" ? `전문가 필요 (${counts.needs_expert_patch})` :
                 `차단됨 (${counts.blocked})`}
              </button>
            ))}
          </div>

          {/* Section table */}
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 40 }}>#</th>
                  <th style={S.th}>섹션</th>
                  <th style={S.th}>상태</th>
                  <th style={S.th}>신뢰도</th>
                  <th style={S.th}>리스크</th>
                  <th style={S.th}>전문가</th>
                  <th style={S.th}>누락 데이터</th>
                  <th style={S.th}>액션</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((section) => (
                  <SectionRow key={section.section_type} section={section} projectId={id!} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── SectionRow ───────────────────────────────────────────────────────
function SectionRow({ section, projectId }: { section: Section; projectId: string }) {
  const statusCfg = STATUS_CFG[section.status] ?? STATUS_CFG.planned;
  const confCfg = CONFIDENCE_CFG[section.confidence] ?? CONFIDENCE_CFG.unknown;
  const riskColor = RISK_CFG[section.risk_level]?.color ?? "#6b7280";

  return (
    <tr style={S.tr}>
      <td style={{ ...S.td, color: "#475569", fontFamily: "monospace" }}>{section.section_order}</td>
      <td style={S.td}>
        <div style={S.sectionName}>{section.title}</div>
        <div style={S.sectionType}>{section.section_type.replace(/_/g, " ")}</div>
      </td>
      <td style={S.td}>
        <span style={{ ...S.badge, background: statusCfg.bg, color: statusCfg.color }}>
          {statusCfg.label}
        </span>
      </td>
      <td style={S.td}>
        <span style={{ ...S.confBadge, color: confCfg.color }}>
          {confCfg.label}
        </span>
      </td>
      <td style={S.td}>
        <span style={{ ...S.riskDot, background: riskColor }} />
        <span style={{ color: riskColor, fontSize: 12 }}>{section.risk_level}</span>
      </td>
      <td style={S.td}>
        {section.requires_expert_patch ? (
          <div>
            {section.required_expert_roles.map((r) => (
              <span key={r} style={S.expertTag}>{r.replace(/_/g, " ")}</span>
            ))}
          </div>
        ) : (
          <span style={S.muted}>—</span>
        )}
      </td>
      <td style={S.td}>
        {section.missing_data.length > 0 ? (
          <div style={S.missingList}>
            {section.missing_data.slice(0, 2).map((m) => (
              <span key={m} style={S.missingTag}>{m}</span>
            ))}
            {section.missing_data.length > 2 && (
              <span style={S.muted}>+{section.missing_data.length - 2}</span>
            )}
          </div>
        ) : (
          <span style={S.muted}>—</span>
        )}
      </td>
      <td style={S.td}>
        {section.id ? (
          <a href={`/im-projects/${projectId}/sections/${section.id}`} style={S.openLink}>
            열기 →
          </a>
        ) : (
          <span style={S.muted}>—</span>
        )}
      </td>
    </tr>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────
function EmptyState({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <div style={S.empty}>
      <div style={S.emptyIcon}>📋</div>
      <h2 style={S.emptyTitle}>아직 섹션이 생성되지 않았습니다</h2>
      <p style={S.emptyText}>
        아웃라인 생성 버튼을 누르면 18개 표준 섹션이 자동으로 계획됩니다.
      </p>
      <button onClick={onGenerate} disabled={generating} style={{ ...S.btn, ...S.btnPrimary, fontSize: 15, padding: "12px 28px" }}>
        {generating ? "생성 중…" : "▶ 아웃라인 생성"}
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────
function statusChipStyle(st: string) {
  const cfg = STATUS_CFG[st];
  return { background: cfg?.bg ?? "#1e293b", color: cfg?.color ?? "#94a3b8" };
}

// ─── Styles ───────────────────────────────────────────────────────────
const S = {
  main: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" } as React.CSSProperties,
  center: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0f1e" } as React.CSSProperties,
  header: { borderBottom: "1px solid #1e293b", padding: "20px 32px", background: "#0d1426" } as React.CSSProperties,
  hRow: { maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 } as React.CSSProperties,
  back: { color: "#475569", fontSize: 12, textDecoration: "none", display: "block", marginBottom: 6 } as React.CSSProperties,
  title: { fontSize: 22, fontWeight: 700, margin: "0 0 10px", color: "#f1f5f9" } as React.CSSProperties,
  countRow: { display: "flex", gap: 8, flexWrap: "wrap" as const } as React.CSSProperties,
  countChip: { borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 } as React.CSSProperties,
  actions: { flexShrink: 0 } as React.CSSProperties,
  btn: { borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none" } as React.CSSProperties,
  btnPrimary: { background: "#2563eb", color: "#fff" } as React.CSSProperties,
  muted: { color: "#475569", fontSize: 12 } as React.CSSProperties,
  errorBanner: { background: "#450a0a", color: "#fca5a5", padding: "10px 32px", fontSize: 13 } as React.CSSProperties,

  body: { maxWidth: 1200, margin: "24px auto", padding: "0 24px" } as React.CSSProperties,
  filterBar: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const } as React.CSSProperties,
  filterBtn: { borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #1e293b", background: "#0d1426", color: "#64748b" } as React.CSSProperties,
  filterBtnActive: { background: "#1e293b", color: "#f1f5f9", borderColor: "#3b82f6" } as React.CSSProperties,

  tableWrap: { overflowX: "auto" as const } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const, background: "#0d1426", borderRadius: 12, overflow: "hidden" } as React.CSSProperties,
  th: { textAlign: "left" as const, padding: "12px 14px", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase" as const, borderBottom: "1px solid #1e293b", background: "#0a0f1e" } as React.CSSProperties,
  tr: { borderBottom: "1px solid #1e293b" } as React.CSSProperties,
  td: { padding: "12px 14px", verticalAlign: "top" as const } as React.CSSProperties,

  sectionName: { fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 2 } as React.CSSProperties,
  sectionType: { fontSize: 11, color: "#475569", fontFamily: "monospace" } as React.CSSProperties,

  badge: { borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" as const } as React.CSSProperties,
  confBadge: { fontSize: 12 } as React.CSSProperties,
  riskDot: { display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 6 } as React.CSSProperties,

  expertTag: { display: "inline-block", background: "#1e1b4b", color: "#a5b4fc", borderRadius: 4, padding: "2px 6px", fontSize: 10, marginBottom: 3, marginRight: 4 } as React.CSSProperties,
  missingList: { display: "flex", flexWrap: "wrap" as const, gap: 4 } as React.CSSProperties,
  missingTag: { background: "#1c1917", border: "1px solid #44403c", color: "#a8a29e", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontFamily: "monospace" } as React.CSSProperties,
  openLink: { color: "#60a5fa", fontSize: 12, textDecoration: "none", fontWeight: 600 } as React.CSSProperties,

  empty: { maxWidth: 480, margin: "80px auto", textAlign: "center" as const, padding: 32 } as React.CSSProperties,
  emptyIcon: { fontSize: 48, marginBottom: 16 } as React.CSSProperties,
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: "0 0 12px" } as React.CSSProperties,
  emptyText: { color: "#64748b", lineHeight: 1.6, marginBottom: 24 } as React.CSSProperties,
};
