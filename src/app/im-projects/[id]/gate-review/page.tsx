"use client";
import { useEffect, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────
interface GateResult {
  gate_type: string;
  status: string;
  violation_count: number;
  last_run?: string;
}

interface GateViolation {
  gate_type: string;
  section_id?: string;
  severity: "p0" | "high" | "medium" | "low";
  issue_type: string;
  message: string;
  recommended_action: string;
  can_override: boolean;
}

interface GateReviewData {
  overall_status: string;
  gates: GateResult[];
  violations: GateViolation[];
  has_p0_violation: boolean;
  buyer_ready_eligible: boolean;
  run_at?: string;
}

// ─── Config ────────────────────────────────────────────────────────────
const GATE_LABELS: Record<string, string> = {
  data_gate:                  "데이터 Gate",
  disclosure_gate:            "공시 Gate",
  risk_gate:                  "리스크 Gate",
  financial_consistency_gate: "재무 일관성 Gate",
  expert_scope_gate:          "전문가 범위 Gate",
  design_quality_gate:        "설계 품질 Gate",
  training_rights_gate:       "학습 권한 Gate",
  buyer_ready_approval_gate:  "Buyer-ready 승인 Gate",
};

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pass:          { label: "통과",     bg: "#052e16", color: "#86efac", border: "#166534" },
  revise:        { label: "수정 필요", bg: "#451a03", color: "#fdba74", border: "#92400e" },
  blocked:       { label: "차단됨",   bg: "#450a0a", color: "#fca5a5", border: "#7f1d1d" },
  expert_required:{ label: "전문가 필요", bg: "#1e1b4b", color: "#a5b4fc", border: "#4338ca" },
  internal_only: { label: "내부 전용", bg: "#0c1a2e", color: "#7dd3fc", border: "#0369a1" },
  not_run:       { label: "미실행",   bg: "#111827", color: "#64748b", border: "#1e293b" },
};

const SEV_CFG: Record<string, { color: string; label: string }> = {
  p0:     { color: "#ef4444", label: "P0" },
  high:   { color: "#f97316", label: "HIGH" },
  medium: { color: "#eab308", label: "MEDIUM" },
  low:    { color: "#22c55e", label: "LOW" },
};

// ─── Page ───────────────────────────────────────────────────────────────
export default function GateReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [review, setReview] = useState<GateReviewData | null>(null);
  const [running, setRunning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [riskAck, setRiskAck] = useState(false);
  const [actorRole, setActorRole] = useState<"reviewer" | "admin">("reviewer");
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => { params.then(({ id }) => setProjectId(id)); }, [params]);

  const runReview = useCallback(async () => {
    if (!projectId) return;
    setRunning(true);
    setError(null);
    try {
      const r = await fetch(`/api/im-projects/${projectId}/gate-review/run`, { method: "POST" });
      const j = await r.json();
      if (j.ok) setReview(j.data);
      else setError(j.message ?? "Gate 검토 실패");
    } finally { setRunning(false); }
  }, [projectId]);

  const approveBuyerReady = useCallback(async () => {
    if (!projectId) return;
    setApproving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { actor_role: actorRole };
      if (overrideMode && overrideReason) {
        body.override_reason = overrideReason;
        body.risk_acknowledged = riskAck;
      }
      const r = await fetch(`/api/im-projects/${projectId}/gate-review/approve-buyer-ready`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j.ok) setApproved(true);
      else setError(j.message ?? "승인 실패");
    } finally { setApproving(false); }
  }, [projectId, actorRole, overrideMode, overrideReason, riskAck]);

  if (approved) {
    return (
      <div style={S.center}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>✅</p>
          <h2 style={{ color: "#86efac", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Buyer-ready 승인 완료</h2>
          <p style={S.muted}>프로젝트가 Buyer-ready 상태로 전환되었습니다.</p>
          <a href={`/im-projects/${projectId}`} style={{ ...S.btn, ...S.btnPrimary, display: "inline-block", marginTop: 20, textDecoration: "none" }}>
            ← 프로젝트 대시보드
          </a>
        </div>
      </div>
    );
  }

  const overallCfg = review ? (STATUS_CFG[review.overall_status] ?? STATUS_CFG.not_run) : STATUS_CFG.not_run;

  return (
    <main style={S.main}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.hRow}>
          <div>
            <a href={`/im-projects/${projectId}`} style={S.back}>← 프로젝트 대시보드</a>
            <h1 style={S.title}>Gate Review Console</h1>
            {review && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <span style={{ ...S.badge, background: overallCfg.bg, color: overallCfg.color, border: `1px solid ${overallCfg.border}`, fontSize: 12 }}>
                  {overallCfg.label}
                </span>
                {review.has_p0_violation && (
                  <span style={{ ...S.badge, background: "#450a0a", color: "#fca5a5", fontSize: 12 }}>⛔ P0 위반</span>
                )}
                {review.buyer_ready_eligible && (
                  <span style={{ ...S.badge, background: "#166534", color: "#bbf7d0", fontSize: 12 }}>✓ Buyer-ready 가능</span>
                )}
              </div>
            )}
          </div>
          <div style={S.hActions}>
            <button onClick={runReview} disabled={running} style={{ ...S.btn, ...S.btnSecondary }} id="btn-run-gate-review">
              {running ? "실행 중…" : "▶ Gate 검토 실행"}
            </button>
            {review?.buyer_ready_eligible && !review.has_p0_violation && (
              <button onClick={approveBuyerReady} disabled={approving} style={{ ...S.btn, ...S.btnSuccess }} id="btn-approve-buyer-ready">
                {approving ? "처리 중…" : "✓ Buyer-ready 승인"}
              </button>
            )}
          </div>
        </div>
        {error && (
          <div style={S.errorBanner}>
            {error}
            <button onClick={() => setError(null)} style={S.dismissBtn}>✕</button>
          </div>
        )}
      </header>

      <div style={S.body}>
        {!review ? (
          <div style={S.emptyCard}>
            <p style={{ fontSize: 36, margin: "0 0 12px" }}>🔍</p>
            <h2 style={S.emptyTitle}>Gate 검토가 실행되지 않았습니다</h2>
            <p style={S.muted}>Gate 검토 실행 버튼을 클릭하여 프로젝트의 모든 Gate를 검사하세요.</p>
            <button onClick={runReview} disabled={running} style={{ ...S.btn, ...S.btnPrimary, marginTop: 20 }}>
              {running ? "실행 중…" : "▶ Gate 검토 실행"}
            </button>
          </div>
        ) : (
          <>
            {/* Gate Cards */}
            <section style={S.gateSection}>
              <h2 style={S.sectionTitle}>Gate 현황</h2>
              <div style={S.gateGrid}>
                {review.gates.map(gate => <GateCard key={gate.gate_type} gate={gate} />)}
              </div>
            </section>

            {/* Violations */}
            {review.violations.length > 0 && (
              <section style={S.violationSection}>
                <h2 style={S.sectionTitle}>
                  위반 사항 ({review.violations.length})
                  {review.has_p0_violation && <span style={{ color: "#ef4444", fontSize: 13, marginLeft: 8 }}>⛔ P0 포함</span>}
                </h2>
                <ViolationTable violations={review.violations} />
              </section>
            )}

            {/* Buyer-ready control */}
            <section style={S.approvalSection}>
              <h2 style={S.sectionTitle}>Buyer-ready 승인</h2>
              {review.has_p0_violation ? (
                <div style={S.blockedBox}>
                  <p style={S.blockedTitle}>⛔ Buyer-ready 승인이 차단되었습니다</p>
                  <p style={S.blockedText}>P0 공시 위반이 있어 외부 공유가 불가능합니다. 위반 사항을 먼저 수정해야 합니다.</p>
                </div>
              ) : review.buyer_ready_eligible ? (
                <div style={S.approvalBox}>
                  <p style={{ color: "#86efac", fontWeight: 700, marginBottom: 12 }}>✓ 모든 Gate를 통과했습니다. Buyer-ready 승인이 가능합니다.</p>
                  <div style={S.field}>
                    <label style={S.label}>승인 역할</label>
                    <select style={S.select} value={actorRole} onChange={e => setActorRole(e.target.value as "reviewer" | "admin")}>
                      <option value="reviewer">Reviewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button onClick={approveBuyerReady} disabled={approving} style={{ ...S.btn, ...S.btnSuccess, marginTop: 12 }}>
                    {approving ? "처리 중…" : "✓ Buyer-ready 승인"}
                  </button>
                </div>
              ) : (
                <div style={S.overrideBox}>
                  <p style={{ color: "#fdba74", fontWeight: 700, marginBottom: 8 }}>⚠ 일부 Gate가 통과되지 않았습니다.</p>
                  <p style={S.muted}>수정 후 Gate 검토를 다시 실행하거나, Override 사유를 입력하여 진행하세요.</p>
                  <button onClick={() => setOverrideMode(!overrideMode)}
                    style={{ ...S.btn, ...S.btnSecondary, marginTop: 12 }}>
                    {overrideMode ? "Override 취소" : "⚡ Override with Reason"}
                  </button>
                  {overrideMode && (
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={S.field}>
                        <label style={S.label}>승인 역할</label>
                        <select style={S.select} value={actorRole} onChange={e => setActorRole(e.target.value as "reviewer" | "admin")}>
                          <option value="reviewer">Reviewer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Override 사유 * (필수)</label>
                        <textarea style={S.textarea} rows={3}
                          value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                          placeholder="Override 사유를 상세히 입력하세요. 이 기록은 감사 추적에 남습니다." />
                      </div>
                      <label style={{ ...S.label, display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={riskAck} onChange={e => setRiskAck(e.target.checked)} />
                        리스크를 인지하고 책임 하에 진행합니다.
                      </label>
                      <button onClick={approveBuyerReady} disabled={approving || !overrideReason || !riskAck}
                        style={{ ...S.btn, background: "#92400e", color: "#fdba74" }}>
                        {approving ? "처리 중…" : "⚡ Override 후 승인"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// ─── GateCard ──────────────────────────────────────────────────────────
function GateCard({ gate }: { gate: GateResult }) {
  const cfg = STATUS_CFG[gate.status] ?? STATUS_CFG.not_run;
  return (
    <div style={{ ...S.gateCard, borderColor: cfg.border }}>
      <div style={S.gateCardTop}>
        <span style={S.gateLabel}>{GATE_LABELS[gate.gate_type] ?? gate.gate_type}</span>
        <span style={{ ...S.badge, background: cfg.bg, color: cfg.color, fontSize: 11 }}>{cfg.label}</span>
      </div>
      {gate.violation_count > 0 && (
        <p style={{ color: "#f97316", fontSize: 12, margin: "6px 0 0" }}>
          위반 {gate.violation_count}건
        </p>
      )}
      {gate.last_run && (
        <p style={{ ...S.muted, fontSize: 11, marginTop: 4 }}>
          {new Date(gate.last_run).toLocaleString("ko-KR")}
        </p>
      )}
    </div>
  );
}

// ─── ViolationTable ────────────────────────────────────────────────────
function ViolationTable({ violations }: { violations: GateViolation[] }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            {["Gate", "심각도", "문제", "권장 조치", "Override 가능"].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {violations.map((v, i) => {
            const sev = SEV_CFG[v.severity] ?? { color: "#64748b", label: v.severity };
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? "#0d1426" : "#0a0f1e" }}>
                <td style={S.td}><span style={S.gateChip}>{GATE_LABELS[v.gate_type]?.replace(" Gate", "") ?? v.gate_type}</span></td>
                <td style={S.td}>
                  <span style={{ color: sev.color, fontWeight: 700, fontSize: 11 }}>{sev.label}</span>
                </td>
                <td style={{ ...S.td, maxWidth: 280 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>{v.message}</p>
                </td>
                <td style={{ ...S.td, maxWidth: 220 }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{v.recommended_action}</p>
                </td>
                <td style={S.td}>
                  {v.can_override
                    ? <span style={{ color: "#f97316", fontSize: 11 }}>가능</span>
                    : <span style={{ color: "#ef4444", fontSize: 11, fontWeight: 700 }}>불가 (P0)</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" },
  center: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0f1e" },
  header: { background: "#0d1426", borderBottom: "1px solid #1e293b", padding: "16px 28px" },
  hRow: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  back: { color: "#475569", fontSize: 12, textDecoration: "none", display: "block", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: "#f1f5f9" },
  hActions: { display: "flex", gap: 8, flexShrink: 0 },
  badge: { borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, display: "inline-block" },
  btn: { borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none" },
  btnPrimary: { background: "#2563eb", color: "#fff" },
  btnSecondary: { background: "#1e293b", color: "#94a3b8" },
  btnSuccess: { background: "#166534", color: "#bbf7d0" },
  muted: { color: "#475569", fontSize: 13, margin: 0 },
  errorBanner: { background: "#450a0a", color: "#fca5a5", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginTop: 10, display: "flex", alignItems: "center", gap: 8, maxWidth: 1100, margin: "10px auto 0" },
  dismissBtn: { background: "transparent", border: "none", color: "#fca5a5", cursor: "pointer", marginLeft: "auto" },
  body: { maxWidth: 1100, margin: "24px auto", padding: "0 28px" },
  emptyCard: { textAlign: "center", padding: "60px 32px", background: "#0d1426", border: "1px solid #1e293b", borderRadius: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" },

  // Gate section
  gateSection: { marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: "0 0 14px" },
  gateGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  gateCard: { background: "#0d1426", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 14px" },
  gateCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  gateLabel: { fontSize: 12, fontWeight: 600, color: "#cbd5e1" },

  // Violation table
  violationSection: { marginBottom: 28 },
  tableWrap: { overflowX: "auto" as const, borderRadius: 8, border: "1px solid #1e293b" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { background: "#111827", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "10px 14px", textAlign: "left" as const, borderBottom: "1px solid #1e293b" },
  td: { padding: "10px 14px", borderBottom: "1px solid #0d1426", verticalAlign: "top" as const },
  gateChip: { background: "#1e293b", color: "#94a3b8", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontFamily: "monospace" },

  // Approval section
  approvalSection: { marginBottom: 28 },
  blockedBox: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "16px 20px" },
  blockedTitle: { color: "#fca5a5", fontWeight: 700, fontSize: 15, margin: "0 0 6px" },
  blockedText: { color: "#f87171", fontSize: 13, margin: 0 },
  approvalBox: { background: "#052e16", border: "1px solid #166534", borderRadius: 10, padding: "16px 20px" },
  overrideBox: { background: "#1c1917", border: "1px solid #44403c", borderRadius: 10, padding: "16px 20px" },
  field: { display: "flex", flexDirection: "column" as const, gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: "#94a3b8" },
  select: { background: "#111827", border: "1px solid #1e293b", borderRadius: 6, color: "#e2e8f0", padding: "7px 10px", fontSize: 13, maxWidth: 300 },
  textarea: { background: "#111827", border: "1px solid #1e293b", borderRadius: 6, color: "#e2e8f0", padding: "8px 10px", fontSize: 13, fontFamily: "inherit", resize: "vertical" as const },
};
