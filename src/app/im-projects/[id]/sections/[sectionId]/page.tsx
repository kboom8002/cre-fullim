"use client";
import { useEffect, useState, useCallback } from "react";
import { isValidSectionTransition, SECTION_STATUS_MACHINE, type SectionStatus } from "@/domain/sections/status-transition";
import { IM_SECTION_DEFINITIONS } from "@/domain/sections/section-planner";
import type { IMSectionType } from "@/domain/readiness/readiness-service";

// ─── Types ─────────────────────────────────────────────────────────────
interface Section {
  id: string;
  section_type: string;
  section_order: number;
  title: string;
  status: SectionStatus;
  confidence: string;
  risk_level: string;
  requires_expert_patch: boolean;
  markdown?: string;
  missing_data?: string[];
  required_expert_roles?: string[];
}

type RightTab = "ssot" | "evidence" | "risk" | "disclosure" | "expert" | "history";

// ─── Badge config ───────────────────────────────────────────────────────
const S_CFG: Record<string, { label: string; bg: string; color: string }> = {
  planned:            { label: "계획됨",       bg: "#1e293b", color: "#94a3b8" },
  ai_draft:           { label: "AI 초안",      bg: "#052e16", color: "#86efac" },
  needs_data:         { label: "데이터 부족",  bg: "#451a03", color: "#fdba74" },
  needs_expert_patch: { label: "전문가 필요",  bg: "#1e1b4b", color: "#a5b4fc" },
  patched:            { label: "패치됨",       bg: "#0f172a", color: "#67e8f9" },
  gate_review:        { label: "Gate 검토",    bg: "#1e1b4b", color: "#c4b5fd" },
  buyer_ready:        { label: "매수자용 완료", bg: "#166534", color: "#bbf7d0" },
  blocked:            { label: "차단됨",       bg: "#450a0a", color: "#fca5a5" },
  not_started:        { label: "미시작",       bg: "#111827", color: "#64748b" },
};

const R_CFG: Record<string, string> = { low: "#22c55e", medium: "#f97316", high: "#ef4444", blocked: "#6b7280" };

const TABS: { id: RightTab; label: string }[] = [
  { id: "ssot",        label: "SSoT" },
  { id: "evidence",    label: "Evidence" },
  { id: "risk",        label: "Risk" },
  { id: "disclosure",  label: "Disclosure" },
  { id: "expert",      label: "Expert" },
  { id: "history",     label: "History" },
];

// ─── Page ───────────────────────────────────────────────────────────────
export default function SectionEditorPage({ params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const [ids, setIds] = useState<{ id: string; sectionId: string } | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [active, setActive] = useState<Section | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("ssot");
  const [editMode, setEditMode] = useState<"preview" | "edit">("preview");
  const [markdown, setMarkdown] = useState("");
  const [generating, setGenerating] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { params.then(setIds); }, [params]);

  // Load section list
  useEffect(() => {
    if (!ids) return;
    fetch(`/api/im-projects/${ids.id}/generate-outline`)
      .then(r => r.json())
      .then(r => {
        const list: Section[] = r.data?.sections ?? [];
        setSections(list);
        const cur = list.find(s => s.id === ids.sectionId) ?? list[0] ?? null;
        if (cur) { setActive(cur); setMarkdown(cur.markdown ?? ""); }
      })
      .finally(() => setLoading(false));
  }, [ids]);

  const selectSection = useCallback((s: Section) => {
    setActive(s);
    setMarkdown(s.markdown ?? "");
    setEditMode("preview");
    setRightTab("ssot");
  }, []);

  const generateDraft = useCallback(async () => {
    if (!active?.id) return;
    setGenerating(true);
    setError(null);
    try {
      const r = await fetch(`/api/im-sections/${active.id}/generate-draft`, { method: "POST" });
      const j = await r.json();
      if (j.ok) {
        setMarkdown(j.data.markdown ?? "");
        setActive(prev => prev ? { ...prev, status: "ai_draft", confidence: j.data.confidence, risk_level: j.data.risk_level } : prev);
        setSections(prev => prev.map(s => s.id === active.id ? { ...s, status: "ai_draft" } : s));
      } else {
        setError(j.message ?? "초안 생성 실패");
      }
    } finally { setGenerating(false); }
  }, [active]);

  const tryTransition = useCallback(async (to: SectionStatus) => {
    if (!active || !ids) return;
    if (!isValidSectionTransition(active.status, to)) {
      setError(`${active.status} → ${to} 전환은 허용되지 않습니다.`);
      return;
    }
    setTransitioning(true);
    try {
      const r = await fetch(`/api/im-sections/${active.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_status: to }),
      });
      const j = await r.json();
      if (j.ok) {
        setActive(prev => prev ? { ...prev, status: to } : prev);
        setSections(prev => prev.map(s => s.id === active.id ? { ...s, status: to } : s));
      } else { setError(j.message ?? "전환 실패"); }
    } finally { setTransitioning(false); }
  }, [active, ids]);

  if (loading) return <div style={S.center}><p style={S.muted}>로딩 중…</p></div>;

  const nextStates = active ? SECTION_STATUS_MACHINE[active.status].filter(s => s !== "blocked") : [];
  // buyer_ready must NOT appear from ai_draft or needs_expert_patch (enforced by state machine)
  const canMarkBuyerReady = active ? isValidSectionTransition(active.status, "buyer_ready") : false;

  return (
    <main style={S.main}>
      {/* Top bar */}
      <header style={S.header}>
        <div style={S.hRow}>
          <a href={`/im-projects/${ids?.id}/sections`} style={S.back}>← 섹션 목록</a>
          <div style={S.hActions}>
            <button onClick={generateDraft} disabled={generating} style={{ ...S.btn, ...S.btnPrimary }} id="btn-generate-draft">
              {generating ? "생성 중…" : "▶ AI 초안 생성"}
            </button>
            {nextStates.map(ns => (
              <button key={ns} onClick={() => tryTransition(ns)} disabled={transitioning}
                style={{ ...S.btn, ...S.btnSecondary }}>
                → {S_CFG[ns]?.label ?? ns}
              </button>
            ))}
            {/* buyer_ready button — only shows if valid (gate_review → buyer_ready only) */}
            {canMarkBuyerReady && (
              <button onClick={() => tryTransition("buyer_ready")} data-testid="btn-mark-buyer-ready"
                style={{ ...S.btn, background: "#166534", color: "#bbf7d0" }}>
                ✓ Buyer-ready 승인
              </button>
            )}
          </div>
        </div>
        {error && <div style={S.errorBanner}>{error} <button onClick={() => setError(null)} style={S.dismissBtn}>✕</button></div>}
      </header>

      <div style={S.threePanel}>
        {/* LEFT: Section nav */}
        <nav style={S.leftPanel} data-testid="section-nav">
          <p style={S.navTitle}>섹션 네비게이션</p>
          {sections.map(s => {
            const cfg = S_CFG[s.status] ?? S_CFG.planned;
            const isActive = s.id === active?.id;
            return (
              <button key={s.id} onClick={() => selectSection(s)} data-testid="section-nav-item"
                style={{ ...S.navItem, ...(isActive ? S.navItemActive : {}) }}>
                <span style={S.navOrder}>{s.section_order}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={S.navName}>{s.title}</p>
                  <span style={{ ...S.badge, background: cfg.bg, color: cfg.color, fontSize: 10 }}>
                    {cfg.label}
                  </span>
                  {s.requires_expert_patch && <span style={S.expertDot}>●</span>}
                </div>
                <span style={{ ...S.riskDot, background: R_CFG[s.risk_level] ?? "#6b7280" }} />
              </button>
            );
          })}
          {sections.length === 0 && (
            <p style={{ ...S.muted, padding: "12px 16px" }}>섹션 없음. 아웃라인을 먼저 생성하세요.</p>
          )}
        </nav>

        {/* CENTER: Editor */}
        <section style={S.centerPanel} data-testid="section-editor-center">
          {active ? (
            <>
              {/* Section header */}
              <div style={S.secHeader}>
                <div>
                  <h1 style={S.secTitle}>{active.title}</h1>
                  <p style={S.secType}>{active.section_type.replace(/_/g, " ")}</p>
                </div>
                <div style={S.secBadges}>
                  <span data-testid="section-status-badge"
                    style={{ ...S.badge, ...S_CFG[active.status] ?? S_CFG.planned }}>
                    {S_CFG[active.status]?.label ?? active.status}
                  </span>
                  <span style={{ ...S.badge, background: R_CFG[active.risk_level] + "22", color: R_CFG[active.risk_level] }}>
                    {active.risk_level} risk
                  </span>
                  {active.requires_expert_patch && (
                    <span style={{ ...S.badge, background: "#1e1b4b", color: "#a5b4fc" }}>전문가 필요</span>
                  )}
                </div>
              </div>

              {/* Editor mode toggle */}
              <div style={S.modeRow}>
                {(["preview", "edit"] as const).map(m => (
                  <button key={m} onClick={() => setEditMode(m)}
                    style={{ ...S.modeBtn, ...(editMode === m ? S.modeBtnActive : {}) }}>
                    {m === "preview" ? "미리보기" : "편집"}
                  </button>
                ))}
              </div>

              {/* Content area */}
              {editMode === "edit" ? (
                <textarea style={S.textarea} value={markdown}
                  onChange={e => setMarkdown(e.target.value)}
                  placeholder="마크다운으로 내용을 입력하세요…"
                  aria-label="섹션 내용 편집" />
              ) : (
                <div style={S.preview}>
                  {markdown ? (
                    <pre style={S.previewText}>{markdown}</pre>
                  ) : (
                    <div style={S.emptyEditor}>
                      <p style={S.muted}>아직 내용이 없습니다. AI 초안을 생성하거나 직접 편집하세요.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Missing data */}
              {(active.missing_data?.length ?? 0) > 0 && (
                <div style={S.missingBox}>
                  <p style={S.missingTitle}>⚠ 누락 데이터</p>
                  <div style={S.chipRow}>
                    {active.missing_data!.map(m => (
                      <span key={m} style={S.missingChip}>{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Template structure */}
              {IM_SECTION_DEFINITIONS[active.section_type as IMSectionType] && (
                <details style={S.templateDetails}>
                  <summary style={S.templateSummary}>섹션 구조 가이드</summary>
                  <p style={S.templateText}>
                    {IM_SECTION_DEFINITIONS[active.section_type as IMSectionType].structure}
                  </p>
                </details>
              )}
            </>
          ) : (
            <div style={S.emptyCenter}>
              <p style={S.muted}>왼쪽에서 섹션을 선택하세요.</p>
            </div>
          )}
        </section>

        {/* RIGHT: Tabs */}
        <aside style={S.rightPanel} data-testid="section-editor-right">
          {/* Tab bar */}
          <div style={S.tabBar}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setRightTab(t.id)}
                data-testid={`tab-${t.id}`}
                style={{ ...S.tab, ...(rightTab === t.id ? S.tabActive : {}) }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={S.tabContent}>
            {rightTab === "ssot" && <SsoTPanel section={active} />}
            {rightTab === "evidence" && <EvidencePanel section={active} />}
            {rightTab === "risk" && <RiskPanel section={active} />}
            {rightTab === "disclosure" && <DisclosurePanel section={active} />}
            {rightTab === "expert" && <ExpertPanel section={active} />}
            {rightTab === "history" && <HistoryPanel sectionId={active?.id} />}
          </div>
        </aside>
      </div>
    </main>
  );
}

// ─── Right Panel components ────────────────────────────────────────────

function SsoTPanel({ section }: { section: Section | null }) {
  if (!section) return <p style={S.muted}>섹션을 선택하세요.</p>;
  const def = IM_SECTION_DEFINITIONS[section.section_type as IMSectionType];
  return (
    <div data-testid="panel-ssot">
      <p style={S.panelTitle}>관련 BSSoT 레이어</p>
      {def?.required_evidence.length ? (
        def.required_evidence.map(e => (
          <div key={e} style={S.refChip}><span style={S.refType}>evidence</span> {e}</div>
        ))
      ) : <p style={S.muted}>표준 레이어 참조</p>}
      <p style={{ ...S.panelTitle, marginTop: 16 }}>구조 가이드</p>
      <p style={S.panelText}>{def?.structure ?? "—"}</p>
    </div>
  );
}

function EvidencePanel({ section }: { section: Section | null }) {
  if (!section) return <p style={S.muted}>섹션을 선택하세요.</p>;
  return (
    <div data-testid="panel-evidence">
      <p style={S.panelTitle}>증거 자료</p>
      <p style={S.muted}>아직 연결된 증거 자료가 없습니다.</p>
      <button style={{ ...S.btn, ...S.btnSecondary, marginTop: 12, width: "100%" }}>
        + 증거 연결
      </button>
    </div>
  );
}

function RiskPanel({ section }: { section: Section | null }) {
  return (
    <div data-testid="panel-risk">
      <p style={S.panelTitle}>리스크 상태</p>
      {section ? (
        <>
          <div style={S.riskRow}>
            <span style={S.panelLabel}>리스크 수준</span>
            <span style={{ color: R_CFG[section.risk_level] ?? "#6b7280", fontWeight: 600 }}>
              {section.risk_level}
            </span>
          </div>
          <div style={S.riskRow}>
            <span style={S.panelLabel}>신뢰도</span>
            <span style={S.panelValue}>{section.confidence}</span>
          </div>
          <p style={{ ...S.panelTitle, marginTop: 12 }}>금지 표현 검사</p>
          <p style={S.muted}>AI 초안 생성 후 자동 검사가 실행됩니다.</p>
        </>
      ) : <p style={S.muted}>섹션을 선택하세요.</p>}
    </div>
  );
}

function DisclosurePanel({ section }: { section: Section | null }) {
  return (
    <div data-testid="panel-disclosure">
      <p style={S.panelTitle}>공개 기준</p>
      {section ? (
        <>
          <div style={S.riskRow}>
            <span style={S.panelLabel}>현재 가시성</span>
            <span style={S.panelValue}>internal_only</span>
          </div>
          <div style={S.riskRow}>
            <span style={S.panelLabel}>Gate 수준</span>
            <span style={S.panelValue}>G3</span>
          </div>
          <p style={{ ...S.muted, marginTop: 8 }}>보호 필드 검사는 AI 초안 생성 시 자동 실행됩니다.</p>
        </>
      ) : <p style={S.muted}>섹션을 선택하세요.</p>}
    </div>
  );
}

function ExpertPanel({ section }: { section: Section | null }) {
  return (
    <div data-testid="panel-expert">
      <p style={S.panelTitle}>전문가 검토</p>
      {section?.requires_expert_patch ? (
        <>
          <p style={{ color: "#a5b4fc", fontSize: 13, marginBottom: 8 }}>전문가 검토가 권장됩니다.</p>
          {section.required_expert_roles?.map(r => (
            <div key={r} style={S.refChip}><span style={S.refType}>role</span> {r.replace(/_/g, " ")}</div>
          ))}
          <button style={{ ...S.btn, ...S.btnSecondary, marginTop: 12, width: "100%" }}>
            전문가 검토 요청
          </button>
        </>
      ) : <p style={S.muted}>전문가 검토가 필요하지 않습니다.</p>}
    </div>
  );
}

function HistoryPanel({ sectionId }: { sectionId?: string }) {
  return (
    <div data-testid="panel-history">
      <p style={S.panelTitle}>버전 이력</p>
      {sectionId ? (
        <p style={S.muted}>AI 초안 생성 후 버전 이력이 표시됩니다.</p>
      ) : (
        <p style={S.muted}>섹션을 선택하세요.</p>
      )}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" },
  center: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0f1e" },
  header: { background: "#0d1426", borderBottom: "1px solid #1e293b", padding: "12px 20px", flexShrink: 0 },
  hRow: { display: "flex", alignItems: "center", gap: 12 },
  back: { color: "#475569", fontSize: 12, textDecoration: "none", flexShrink: 0 },
  hActions: { display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" as const },
  errorBanner: { background: "#450a0a", color: "#fca5a5", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginTop: 8, display: "flex", alignItems: "center", gap: 8 },
  dismissBtn: { background: "transparent", border: "none", color: "#fca5a5", cursor: "pointer", marginLeft: "auto" },
  btn: { borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", whiteSpace: "nowrap" as const },
  btnPrimary: { background: "#2563eb", color: "#fff" },
  btnSecondary: { background: "#1e293b", color: "#94a3b8" },
  muted: { color: "#475569", fontSize: 13, margin: 0 },

  // Three panel
  threePanel: { display: "grid", gridTemplateColumns: "220px 1fr 260px", flex: 1, overflow: "hidden", height: "calc(100vh - 56px)" },

  // Left nav
  leftPanel: { borderRight: "1px solid #1e293b", background: "#0d1426", overflowY: "auto" as const },
  navTitle: { fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "12px 12px 8px", margin: 0 },
  navItem: { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" as const, borderLeft: "3px solid transparent" },
  navItemActive: { background: "#1e293b", borderLeft: "3px solid #3b82f6" },
  navOrder: { fontSize: 10, color: "#475569", fontFamily: "monospace", flexShrink: 0, width: 16 },
  navName: { fontSize: 12, color: "#cbd5e1", margin: "0 0 2px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  expertDot: { color: "#818cf8", fontSize: 8, marginLeft: 4 },
  riskDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },

  // Center
  centerPanel: { overflowY: "auto" as const, padding: "20px 24px" },
  secHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  secTitle: { fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px" },
  secType: { fontSize: 11, color: "#475569", fontFamily: "monospace", margin: 0 },
  secBadges: { display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" as const },
  modeRow: { display: "flex", gap: 4, marginBottom: 14 },
  modeBtn: { borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", border: "1px solid #1e293b", background: "transparent", color: "#64748b" },
  modeBtnActive: { background: "#1e293b", color: "#f1f5f9" },
  textarea: { width: "100%", minHeight: 420, background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontFamily: "monospace", padding: 14, resize: "vertical" as const, boxSizing: "border-box" as const },
  preview: { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: 16, minHeight: 200 },
  previewText: { color: "#cbd5e1", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" as const, margin: 0, fontFamily: "inherit" },
  emptyEditor: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 },
  emptyCenter: { display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: 300 },
  missingBox: { marginTop: 14, background: "#1c1917", border: "1px solid #44403c", borderRadius: 8, padding: "10px 14px" },
  missingTitle: { fontSize: 12, fontWeight: 700, color: "#fdba74", margin: "0 0 8px" },
  chipRow: { display: "flex", flexWrap: "wrap" as const, gap: 6 },
  missingChip: { background: "#111827", border: "1px solid #44403c", color: "#a8a29e", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "monospace" },
  templateDetails: { marginTop: 14, background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px" },
  templateSummary: { fontSize: 12, color: "#64748b", cursor: "pointer" },
  templateText: { fontSize: 12, color: "#475569", marginTop: 8, lineHeight: 1.6 },

  // Right
  rightPanel: { borderLeft: "1px solid #1e293b", background: "#0d1426", display: "flex", flexDirection: "column" as const },
  tabBar: { display: "flex", borderBottom: "1px solid #1e293b", flexShrink: 0 },
  tab: { flex: 1, padding: "8px 2px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", color: "#64748b", borderBottom: "2px solid transparent" },
  tabActive: { color: "#60a5fa", borderBottom: "2px solid #3b82f6", background: "#0a0f1e" },
  tabContent: { overflowY: "auto" as const, padding: "14px 12px", flex: 1 },

  // Panel content
  panelTitle: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", margin: "0 0 10px" },
  panelLabel: { fontSize: 12, color: "#475569" },
  panelValue: { fontSize: 12, color: "#94a3b8", fontFamily: "monospace" },
  panelText: { fontSize: 12, color: "#64748b", lineHeight: 1.6, margin: 0 },
  riskRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1e293b" },
  refChip: { display: "flex", alignItems: "center", gap: 6, background: "#111827", borderRadius: 6, padding: "5px 8px", marginBottom: 4, fontSize: 12, color: "#94a3b8" },
  refType: { background: "#1e293b", color: "#64748b", borderRadius: 3, padding: "1px 5px", fontSize: 10, fontFamily: "monospace" },
  badge: { borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600, display: "inline-block" },
};
