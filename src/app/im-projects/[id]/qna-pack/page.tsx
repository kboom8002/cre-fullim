"use client";
import { useEffect, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────
interface QAItem {
  id?: string;
  section_type: string;
  question: string;
  answer_status: string;
  draft_answer?: string;
  required_evidence: string[];
  visibility: string;
  expert_required: boolean;
}

interface EvidenceItem {
  id: string;
  title: string;
  evidence_type: string;
  review_status: string;
  visibility: string;
  available_to_buyer: boolean;
}

interface PackData {
  pack_id: string;
  questions_count: number;
  evidence_index: { project_id: string; items: EvidenceItem[] };
  dealroom_payload: unknown;
}

// ─── Config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  answer_ready:      { label: "답변 준비됨",        color: "#86efac", bg: "#052e16" },
  needs_owner_answer:{ label: "매도자 답변 필요",   color: "#fdba74", bg: "#451a03" },
  needs_evidence:    { label: "증거 자료 필요",     color: "#7dd3fc", bg: "#0c1a2e" },
  expert_required:   { label: "전문가 검토 필요",   color: "#a5b4fc", bg: "#1e1b4b" },
};

const VIS_CFG: Record<string, { label: string; color: string }> = {
  buyer_ready:   { label: "매수자 공유 가능", color: "#86efac" },
  gate_restricted:{ label: "Gate 통과 후 공유", color: "#fdba74" },
  internal_only: { label: "내부 전용", color: "#94a3b8" },
  private_truth: { label: "원본 비공개", color: "#fca5a5" },
  blocked:       { label: "차단됨", color: "#ef4444" },
};

// ─── Page ───────────────────────────────────────────────────────────────
export default function QnaPackPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [packData, setPackData] = useState<PackData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"qna" | "evidence" | "payload">("qna");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => { params.then(({ id }) => setProjectId(id)); }, [params]);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/im-projects/${projectId}/qna-pack/generate`)
      .then(r => r.json())
      .then(r => {
        if (r.ok && r.data) {
          setQuestions(r.data.questions ?? []);
        }
      });
  }, [projectId]);

  const generate = useCallback(async () => {
    if (!projectId) return;
    setGenerating(true);
    setError(null);
    try {
      const r = await fetch(`/api/im-projects/${projectId}/qna-pack/generate`, { method: "POST" });
      const j = await r.json();
      if (j.ok) {
        setPackData(j.data);
        setEvidenceItems(j.data.evidence_index?.items ?? []);
        // Reload Q&A items
        const r2 = await fetch(`/api/im-projects/${projectId}/qna-pack/generate`);
        const j2 = await r2.json();
        if (j2.ok && j2.data) setQuestions(j2.data.questions ?? []);
      } else {
        setError(j.message ?? "생성 실패");
      }
    } finally { setGenerating(false); }
  }, [projectId]);

  const filtered = filterStatus === "all"
    ? questions
    : questions.filter(q => q.answer_status === filterStatus);

  const statusCounts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.answer_status] = (acc[q.answer_status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main style={S.main}>
      <header style={S.header}>
        <div style={S.hRow}>
          <div>
            <a href={`/im-projects/${projectId}`} style={S.back}>← 프로젝트 대시보드</a>
            <h1 style={S.title}>Q&A Pack · Evidence Index</h1>
            {packData && (
              <p style={S.subtitle}>{packData.questions_count}개 질문 · {evidenceItems.length}개 증거 자료</p>
            )}
          </div>
          <button onClick={generate} disabled={generating} id="btn-generate-qna"
            style={{ ...S.btn, ...(generating ? S.btnDisabled : S.btnPrimary) }}>
            {generating ? "생성 중…" : "▶ Q&A Pack 생성"}
          </button>
        </div>
        {error && <div style={S.errorBanner}>{error}<button onClick={() => setError(null)} style={S.dismissBtn}>✕</button></div>}
      </header>

      <div style={S.body}>
        {/* Tab bar */}
        <div style={S.tabBar}>
          {([
            { id: "qna", label: `Q&A (${questions.length})` },
            { id: "evidence", label: `Evidence Index (${evidenceItems.length})` },
            { id: "payload", label: "Deal Room Payload" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ ...S.tab, ...(activeTab === t.id ? S.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Q&A Tab */}
        {activeTab === "qna" && (
          <div>
            {/* Status filter */}
            <div style={S.filterBar}>
              {(["all", "answer_ready", "needs_owner_answer", "needs_evidence", "expert_required"] as const).map(f => {
                const count = f === "all" ? questions.length : (statusCounts[f] ?? 0);
                const cfg = f === "all" ? null : STATUS_CFG[f];
                return (
                  <button key={f} onClick={() => setFilterStatus(f)}
                    style={{ ...S.filterBtn, ...(filterStatus === f ? S.filterBtnActive : {}), ...(cfg ? { borderColor: cfg.color + "44" } : {}) }}>
                    {cfg ? <span style={{ color: cfg.color, marginRight: 4 }}>●</span> : null}
                    {f === "all" ? `전체 (${count})` : `${STATUS_CFG[f]?.label} (${count})`}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div style={S.emptyCard}>
                <p style={{ fontSize: 32, margin: "0 0 12px" }}>💬</p>
                <p style={S.emptyTitle}>Q&A Pack이 없습니다</p>
                <p style={S.muted}>Q&A Pack 생성 버튼을 클릭하여 질문 목록을 만드세요.</p>
              </div>
            ) : (
              <div style={S.qaList}>
                {filtered.map((q, i) => <QACard key={q.id ?? i} item={q} />)}
              </div>
            )}
          </div>
        )}

        {/* Evidence Index Tab */}
        {activeTab === "evidence" && (
          <div>
            {evidenceItems.length === 0 ? (
              <div style={S.emptyCard}>
                <p style={S.muted}>Q&A Pack을 생성하면 Evidence Index가 표시됩니다.</p>
              </div>
            ) : (
              <div style={S.evidenceTable}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {["자료 제목", "유형", "검토 상태", "공개 범위", "매수자 열람"].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceItems.map((ev, i) => {
                      const visCfg = VIS_CFG[ev.visibility] ?? { label: ev.visibility, color: "#64748b" };
                      return (
                        <tr key={ev.id} style={{ background: i % 2 === 0 ? "#0d1426" : "#0a0f1e" }}>
                          <td style={S.td}><span style={S.evTitle}>{ev.title}</span></td>
                          <td style={S.td}><span style={S.chip}>{ev.evidence_type.replace(/_/g, " ")}</span></td>
                          <td style={S.td}><span style={{ ...S.chip, color: "#94a3b8" }}>{ev.review_status}</span></td>
                          <td style={S.td}><span style={{ color: visCfg.color, fontSize: 12 }}>{visCfg.label}</span></td>
                          <td style={S.td}>
                            {ev.available_to_buyer
                              ? <span style={{ color: "#86efac", fontWeight: 700 }}>✓</span>
                              : <span style={{ color: "#ef4444" }}>✗</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Deal Room Payload Tab */}
        {activeTab === "payload" && (
          <div>
            {!packData?.dealroom_payload ? (
              <div style={S.emptyCard}>
                <p style={{ fontSize: 32, margin: "0 0 12px" }}>🏠</p>
                <p style={S.emptyTitle}>Deal Room Payload</p>
                <p style={S.muted}>
                  Deal Room payload는 프로젝트가 <strong style={{ color: "#86efac" }}>buyer_ready</strong> 상태일 때 생성됩니다.
                </p>
              </div>
            ) : (
              <div>
                <p style={{ ...S.muted, marginBottom: 12 }}>※ buyer_ready 질문만 포함됩니다. 비공개 증거 자료는 제외됩니다.</p>
                <pre style={S.payloadBox}>
                  {JSON.stringify(packData.dealroom_payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── QACard ────────────────────────────────────────────────────────────
function QACard({ item }: { item: QAItem }) {
  const cfg = STATUS_CFG[item.answer_status] ?? { label: item.answer_status, color: "#64748b", bg: "#111827" };
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={S.qaCard}>
      <div style={S.qaCardTop} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1 }}>
          <span style={{ ...S.badge, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          <span style={{ ...S.chip, marginLeft: 8 }}>{item.section_type.replace(/_/g, " ")}</span>
          {item.expert_required && (
            <span style={{ ...S.chip, color: "#a5b4fc", marginLeft: 6 }}>전문가 필요</span>
          )}
        </div>
        <span style={S.expandBtn}>{expanded ? "▲" : "▼"}</span>
      </div>
      <p style={S.qaQuestion}>{item.question}</p>

      {expanded && (
        <div style={S.qaExpanded}>
          {item.draft_answer && (
            <div style={S.answerBox}>
              <p style={S.answerLabel}>AI 초안 답변</p>
              <p style={S.answerText}>{item.draft_answer}</p>
            </div>
          )}
          {item.required_evidence.length > 0 && (
            <div style={S.evidenceList}>
              <p style={S.answerLabel}>필요 증거 자료</p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                {item.required_evidence.map(e => (
                  <span key={e} style={S.evChip}>{e.replace(/_/g, " ")}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" },
  header: { background: "#0d1426", borderBottom: "1px solid #1e293b", padding: "16px 28px" },
  hRow: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  back: { color: "#475569", fontSize: 12, textDecoration: "none", display: "block", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#f1f5f9" },
  subtitle: { fontSize: 13, color: "#64748b", margin: 0 },
  btn: { borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", flexShrink: 0 },
  btnPrimary: { background: "#2563eb", color: "#fff" },
  btnDisabled: { background: "#1e293b", color: "#475569", cursor: "not-allowed" },
  muted: { color: "#475569", fontSize: 13, margin: 0 },
  badge: { borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 },
  chip: { background: "#1e293b", color: "#94a3b8", borderRadius: 4, padding: "2px 6px", fontSize: 10 },
  errorBanner: { background: "#450a0a", color: "#fca5a5", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginTop: 10, display: "flex", alignItems: "center", gap: 8 },
  dismissBtn: { background: "transparent", border: "none", color: "#fca5a5", cursor: "pointer", marginLeft: "auto" },
  body: { maxWidth: 1100, margin: "0 auto", padding: "20px 28px" },
  // Tabs
  tabBar: { display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 0 },
  tab: { padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", color: "#64748b", borderBottom: "2px solid transparent" },
  tabActive: { color: "#60a5fa", borderBottom: "2px solid #3b82f6" },
  // Filter
  filterBar: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const },
  filterBtn: { borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #1e293b", background: "#0d1426", color: "#64748b" },
  filterBtnActive: { background: "#1e293b", color: "#f1f5f9" },
  // Q&A
  qaList: { display: "flex", flexDirection: "column" as const, gap: 10 },
  qaCard: { background: "#0d1426", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 16px", cursor: "pointer" },
  qaCardTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  qaQuestion: { fontSize: 14, fontWeight: 600, color: "#f1f5f9", margin: 0, lineHeight: 1.5 },
  expandBtn: { fontSize: 10, color: "#475569", flexShrink: 0 },
  qaExpanded: { marginTop: 12, display: "flex", flexDirection: "column" as const, gap: 10, borderTop: "1px solid #1e293b", paddingTop: 12 },
  answerBox: { background: "#111827", borderRadius: 6, padding: "10px 12px" },
  answerLabel: { fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, margin: "0 0 6px", letterSpacing: "0.06em" },
  answerText: { fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 },
  evidenceList: { background: "#0c1a2e", borderRadius: 6, padding: "8px 12px" },
  evChip: { background: "#1e293b", color: "#7dd3fc", borderRadius: 4, padding: "2px 8px", fontSize: 11, border: "1px solid #0369a1" },
  // Evidence table
  evidenceTable: { overflowX: "auto" as const, borderRadius: 8, border: "1px solid #1e293b" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { background: "#111827", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "10px 14px", textAlign: "left" as const, borderBottom: "1px solid #1e293b" },
  td: { padding: "10px 14px", borderBottom: "1px solid #0d1426", verticalAlign: "top" as const, fontSize: 12 },
  evTitle: { color: "#cbd5e1", fontWeight: 600 },
  // Payload
  payloadBox: { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: 16, color: "#94a3b8", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" as const, overflowX: "auto" as const },
  // Empty
  emptyCard: { textAlign: "center" as const, padding: "48px 32px", background: "#0d1426", border: "1px solid #1e293b", borderRadius: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" },
};
