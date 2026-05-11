"use client";
import { useEffect, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────
interface Eligibility {
  can_export_draft: boolean;
  can_export_buyer_ready: boolean;
  blocking_reasons: string[];
  export_mode: string;
}

interface Section {
  id: string;
  section_order: number;
  section_type: string;
  title: string;
  status: string;
  risk_level: string;
  markdown?: string;
  missing_data?: string[];
}

type ExportType = "markdown" | "pdf" | "pptx" | "web" | "dealroom_payload";
type ExportMode = "draft" | "buyer_ready" | "internal";

// ─── Config ────────────────────────────────────────────────────────────
const EXPORT_TYPES: { id: ExportType; label: string; icon: string; desc: string }[] = [
  { id: "markdown", label: "Markdown",      icon: "📝", desc: "구조화된 마크다운 문서 (.md)" },
  { id: "pdf",      label: "PDF",           icon: "📄", desc: "PDF 내보내기 (렌더링 연동 필요)" },
  { id: "pptx",     label: "PPTX 아웃라인",  icon: "📊", desc: "슬라이드 구조 + 발표자 노트" },
  { id: "web",      label: "Web 미리보기",   icon: "🌐", desc: "인터랙티브 웹 IM 미리보기" },
  { id: "dealroom_payload", label: "Deal Room", icon: "🏠", desc: "딜룸 패키지 (Buyer-ready 전용)" },
];

const STATUS_CFG: Record<string, { color: string }> = {
  buyer_ready: { color: "#86efac" },
  ai_draft:    { color: "#7dd3fc" },
  patched:     { color: "#a5b4fc" },
  gate_review: { color: "#c4b5fd" },
  blocked:     { color: "#fca5a5" },
  planned:     { color: "#94a3b8" },
};

const RISK_COLOR: Record<string, string> = { low: "#22c55e", medium: "#f97316", high: "#ef4444" };

// ─── Page ───────────────────────────────────────────────────────────────
export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedType, setSelectedType] = useState<ExportType>("markdown");
  const [selectedMode, setSelectedMode] = useState<ExportMode>("draft");
  const [includedSections, setIncludedSections] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => { params.then(({ id }) => setProjectId(id)); }, [params]);

  // Load eligibility + sections
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/im-projects/${projectId}/export`)
      .then(r => r.json())
      .then(r => { if (r.ok) setEligibility(r.data); });

    fetch(`/api/im-projects/${projectId}/generate-outline`)
      .then(r => r.json())
      .then(r => {
        const list: Section[] = r.data?.sections ?? [];
        setSections(list);
        setIncludedSections(new Set(list.map((s: Section) => s.id)));
      });
  }, [projectId]);

  // Auto-set mode based on eligibility
  useEffect(() => {
    if (!eligibility) return;
    if (eligibility.can_export_buyer_ready) setSelectedMode("buyer_ready");
    else setSelectedMode("draft");
  }, [eligibility]);

  const toggleSection = useCallback((id: string) => {
    setIncludedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const runExport = useCallback(async () => {
    if (!projectId) return;
    setExporting(true);
    setError(null);
    setResult(null);
    setPreviewContent(null);

    try {
      const r = await fetch(`/api/im-projects/${projectId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          export_type: selectedType,
          export_mode: selectedMode,
          section_ids: includedSections.size > 0 ? [...includedSections] : undefined,
        }),
      });
      const j = await r.json();
      if (j.ok) {
        setResult(j.data);
        if (j.data.output?.markdown) setPreviewContent(j.data.output.markdown as string);
        else if (j.data.output?.pptx_outline) setPreviewContent(JSON.stringify(j.data.output.pptx_outline, null, 2));
        else if (j.data.output?.markdown_source) setPreviewContent(j.data.output.markdown_source as string);
      } else {
        setError(j.message ?? "내보내기 실패");
      }
    } finally { setExporting(false); }
  }, [projectId, selectedType, selectedMode, includedSections]);

  const downloadMarkdown = useCallback(() => {
    if (!previewContent) return;
    const blob = new Blob([previewContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `full-im-${projectId}-${selectedMode}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [previewContent, projectId, selectedMode]);

  return (
    <main style={S.main}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.hRow}>
          <div>
            <a href={`/im-projects/${projectId}`} style={S.back}>← 프로젝트 대시보드</a>
            <h1 style={S.title}>내보내기</h1>
          </div>
          <div style={S.hActions}>
            {result && previewContent && (
              <button onClick={downloadMarkdown} style={{ ...S.btn, ...S.btnSecondary }}>
                ⬇ 다운로드
              </button>
            )}
            <button onClick={runExport} disabled={exporting} id="btn-export"
              style={{ ...S.btn, ...(exporting ? S.btnDisabled : S.btnPrimary) }}>
              {exporting ? "내보내는 중…" : `▶ ${EXPORT_TYPES.find(t => t.id === selectedType)?.label ?? "내보내기"}`}
            </button>
          </div>
        </div>
        {error && (
          <div style={S.errorBanner}>
            {error}
            <button onClick={() => setError(null)} style={S.dismissBtn}>✕</button>
          </div>
        )}
      </header>

      <div style={S.threePanel}>
        {/* LEFT: Controls */}
        <aside style={S.leftPanel}>
          {/* Eligibility card */}
          <div style={S.card}>
            <p style={S.cardTitle}>내보내기 가능 여부</p>
            {eligibility ? (
              <>
                <div style={S.eligRow}>
                  <span style={S.eligLabel}>초안 내보내기</span>
                  <span style={{ color: "#86efac", fontWeight: 700 }}>✓ 가능</span>
                </div>
                <div style={S.eligRow}>
                  <span style={S.eligLabel}>Buyer-ready 내보내기</span>
                  <span style={{ color: eligibility.can_export_buyer_ready ? "#86efac" : "#fca5a5", fontWeight: 700 }}>
                    {eligibility.can_export_buyer_ready ? "✓ 가능" : "✗ 차단됨"}
                  </span>
                </div>
                {eligibility.blocking_reasons.length > 0 && (
                  <div style={S.blockingList}>
                    {eligibility.blocking_reasons.map((r, i) => (
                      <p key={i} style={S.blockingItem}>⚠ {r}</p>
                    ))}
                  </div>
                )}
              </>
            ) : <p style={S.muted}>로딩 중…</p>}
          </div>

          {/* Export type */}
          <div style={S.card}>
            <p style={S.cardTitle}>내보내기 유형</p>
            {EXPORT_TYPES.map(t => (
              <button key={t.id} onClick={() => setSelectedType(t.id)}
                style={{ ...S.typeBtn, ...(selectedType === t.id ? S.typeBtnActive : {}) }}>
                <span style={S.typeIcon}>{t.icon}</span>
                <div>
                  <p style={S.typeName}>{t.label}</p>
                  <p style={S.typeDesc}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Export mode */}
          <div style={S.card}>
            <p style={S.cardTitle}>내보내기 모드</p>
            {(["draft", "buyer_ready", "internal"] as ExportMode[]).map(m => {
              const blocked = m === "buyer_ready" && !eligibility?.can_export_buyer_ready;
              return (
                <button key={m} onClick={() => !blocked && setSelectedMode(m)} disabled={blocked}
                  style={{ ...S.modeBtn, ...(selectedMode === m ? S.modeBtnActive : {}), ...(blocked ? S.modeBtnDisabled : {}) }}>
                  <span style={{ fontWeight: 700 }}>
                    {m === "draft" ? "초안 (DRAFT)" : m === "buyer_ready" ? "Buyer-ready" : "내부용"}
                  </span>
                  {blocked && <span style={S.blockedTag}>승인 필요</span>}
                </button>
              );
            })}
          </div>

          {/* Section checklist */}
          <div style={{ ...S.card, maxHeight: 360, overflowY: "auto" as const }}>
            <p style={S.cardTitle}>포함 섹션 ({includedSections.size}/{sections.length})</p>
            {sections.map(s => {
              const statusColor = STATUS_CFG[s.status]?.color ?? "#64748b";
              const riskColor = RISK_COLOR[s.risk_level] ?? "#6b7280";
              return (
                <label key={s.id} style={S.sectionRow}>
                  <input type="checkbox" checked={includedSections.has(s.id)} onChange={() => toggleSection(s.id)} />
                  <div style={{ flex: 1 }}>
                    <span style={S.sectionName}>{s.section_order}. {s.title}</span>
                    <div style={S.sectionBadges}>
                      <span style={{ color: statusColor, fontSize: 10 }}>{s.status}</span>
                      <span style={{ ...S.riskDot, background: riskColor }} />
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </aside>

        {/* CENTER: Preview */}
        <section style={S.centerPanel}>
          {result ? (
            <>
              <div style={S.resultHeader}>
                <span style={{ ...S.badge, background: "#052e16", color: "#86efac" }}>✓ 완료</span>
                <span style={S.muted}>Job ID: {String(result.job_id ?? "—")}</span>
                <span style={S.muted}>{String(result.latency_ms ?? "—")}ms</span>
              </div>
              {previewContent ? (
                <pre style={S.previewText}>{previewContent}</pre>
              ) : (
                <div style={S.emptyPreview}>
                  <p style={S.muted}>미리보기를 지원하지 않는 형식입니다.</p>
                </div>
              )}
            </>
          ) : (
            <div style={S.emptyPreview}>
              <p style={{ fontSize: 36, margin: "0 0 12px" }}>
                {EXPORT_TYPES.find(t => t.id === selectedType)?.icon ?? "📄"}
              </p>
              <p style={S.emptyTitle}>{EXPORT_TYPES.find(t => t.id === selectedType)?.label ?? "내보내기"} 미리보기</p>
              <p style={S.muted}>내보내기 버튼을 클릭하면 이 영역에 결과가 표시됩니다.</p>
            </div>
          )}
        </section>

        {/* RIGHT: Info panel */}
        <aside style={S.rightPanel}>
          <p style={S.panelTitle}>내보내기 규칙</p>

          <div style={S.infoCard}>
            <p style={S.infoLabel}>초안 내보내기</p>
            <p style={S.infoText}>항상 허용. DRAFT 라벨 + 면책 문구가 포함됩니다. 외부 공유용이 아닙니다.</p>
          </div>

          <div style={S.infoCard}>
            <p style={S.infoLabel}>Buyer-ready 내보내기</p>
            <p style={S.infoText}>Gate 검토 통과 + Reviewer 승인 필요. P0 위반 시 차단됩니다.</p>
          </div>

          <div style={S.infoCard}>
            <p style={S.infoLabel}>면책 문구</p>
            <p style={S.infoText}>모든 내보내기에 표준 면책 문구가 포함됩니다.</p>
          </div>

          <p style={{ ...S.panelTitle, marginTop: 16 }}>최근 내보내기 이력</p>
          <p style={S.muted}>내보내기 실행 후 이력이 표시됩니다.</p>

          {result && (
            <div style={{ ...S.infoCard, marginTop: 12, background: "#052e16", borderColor: "#166534" }}>
              <p style={{ color: "#86efac", fontWeight: 700, margin: "0 0 4px" }}>최근 내보내기</p>
              <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>
                {String(result.export_type ?? "")} · {String(result.export_mode ?? "")} · {String(result.latency_ms ?? "—")}ms
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" },
  header: { background: "#0d1426", borderBottom: "1px solid #1e293b", padding: "16px 24px" },
  hRow: { maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  back: { color: "#475569", fontSize: 12, textDecoration: "none", display: "block", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: "#f1f5f9" },
  hActions: { display: "flex", gap: 8, alignItems: "center", flexShrink: 0 },
  btn: { borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none" },
  btnPrimary: { background: "#2563eb", color: "#fff" },
  btnSecondary: { background: "#1e293b", color: "#94a3b8" },
  btnDisabled: { background: "#1e293b", color: "#475569", cursor: "not-allowed" },
  muted: { color: "#475569", fontSize: 13, margin: 0 },
  badge: { borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 },
  errorBanner: { background: "#450a0a", color: "#fca5a5", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginTop: 10, display: "flex", alignItems: "center", gap: 8 },
  dismissBtn: { background: "transparent", border: "none", color: "#fca5a5", cursor: "pointer", marginLeft: "auto" },

  // Layout
  threePanel: { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "260px 1fr 220px", gap: 0, height: "calc(100vh - 64px)" },

  // Left panel
  leftPanel: { borderRight: "1px solid #1e293b", overflowY: "auto" as const, padding: "16px 12px", display: "flex", flexDirection: "column" as const, gap: 12 },
  card: { background: "#0d1426", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 14px" },
  cardTitle: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", margin: "0 0 10px" },

  // Eligibility
  eligRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #1e293b" },
  eligLabel: { fontSize: 12, color: "#94a3b8" },
  blockingList: { marginTop: 8, display: "flex", flexDirection: "column" as const, gap: 4 },
  blockingItem: { fontSize: 11, color: "#fdba74", margin: 0 },

  // Export type
  typeBtn: { width: "100%", display: "flex", alignItems: "flex-start", gap: 10, padding: "8px", borderRadius: 6, border: "1px solid transparent", background: "transparent", cursor: "pointer", marginBottom: 4, textAlign: "left" as const },
  typeBtnActive: { background: "#1e293b", border: "1px solid #3b82f6" },
  typeIcon: { fontSize: 18, flexShrink: 0 },
  typeName: { fontSize: 12, fontWeight: 700, color: "#cbd5e1", margin: 0 },
  typeDesc: { fontSize: 10, color: "#64748b", margin: "2px 0 0" },

  // Mode
  modeBtn: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 6, border: "1px solid transparent", background: "transparent", cursor: "pointer", fontSize: 12, color: "#64748b", marginBottom: 4 },
  modeBtnActive: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #3b82f6" },
  modeBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  blockedTag: { fontSize: 9, background: "#450a0a", color: "#fca5a5", borderRadius: 4, padding: "1px 4px" },

  // Section checklist
  sectionRow: { display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0", borderBottom: "1px solid #0a0f1e", cursor: "pointer" },
  sectionName: { fontSize: 11, color: "#94a3b8", display: "block" },
  sectionBadges: { display: "flex", alignItems: "center", gap: 4, marginTop: 2 },
  riskDot: { width: 6, height: 6, borderRadius: "50%" },

  // Center
  centerPanel: { overflowY: "auto" as const, padding: "20px 24px" },
  resultHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  previewText: { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: 16, color: "#94a3b8", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" as const, margin: 0, fontFamily: "monospace", maxHeight: "calc(100vh - 200px)", overflowY: "auto" as const },
  emptyPreview: { display: "flex", flexDirection: "column" as const, justifyContent: "center", alignItems: "center", height: "60vh", textAlign: "center" as const },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" },

  // Right panel
  rightPanel: { borderLeft: "1px solid #1e293b", padding: "16px 14px", overflowY: "auto" as const },
  panelTitle: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", margin: "0 0 10px" },
  infoCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px", marginBottom: 8 },
  infoLabel: { fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: "0 0 4px" },
  infoText: { fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.5 },
};
