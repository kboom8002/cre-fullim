"use client";
import { useEffect, useState } from "react";

interface GateReviewProject {
  id: string;
  status: string;
  readiness_score: number;
  created_at: string;
  gate_overall_status?: string;
  has_p0_violation?: boolean;
  buyer_ready_eligible?: boolean;
}

const GATE_CFG: Record<string, { color: string; label: string }> = {
  not_run:  { color: "#94a3b8", label: "미실행" },
  pass:     { color: "#86efac", label: "통과" },
  revise:   { color: "#fdba74", label: "수정 필요" },
  blocked:  { color: "#fca5a5", label: "차단됨" },
  expert_required: { color: "#a5b4fc", label: "전문가 필요" },
};

export default function ReviewerGateReviewsPage() {
  const [projects, setProjects] = useState<GateReviewProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/gate-queue", { headers: { "x-actor-role": "reviewer" } })
      .then(r => r.json())
      .then(r => { if (r.ok) setProjects(r.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const p0Count = projects.filter(p => p.has_p0_violation).length;
  const eligibleCount = projects.filter(p => p.buyer_ready_eligible).length;

  return (
    <main style={S.main}>
      <header style={S.header}>
        <div style={S.hRow}>
          <div>
            <p style={S.breadcrumb}>Reviewer → Gate 검토 큐</p>
            <h1 style={S.title}>Gate 검토 큐</h1>
            <div style={S.statsRow}>
              {p0Count > 0 && (
                <span style={S.alertTag}>⚠ P0 위반 {p0Count}건</span>
              )}
              {eligibleCount > 0 && (
                <span style={S.okTag}>✓ Buyer-ready 후보 {eligibleCount}건</span>
              )}
            </div>
          </div>
          <a href="/admin" style={S.backBtn}>← Admin 홈</a>
        </div>
      </header>
      <div style={S.body}>
        {loading ? (
          <p style={S.muted}>로딩 중…</p>
        ) : projects.length === 0 ? (
          <div style={S.emptyCard}>
            <p style={{ fontSize: 32, margin: "0 0 12px" }}>🔍</p>
            <p style={{ color: "#f1f5f9", fontWeight: 700, margin: "0 0 6px" }}>검토 대기 프로젝트 없음</p>
            <p style={S.muted}>Gate 검토가 요청된 프로젝트가 없습니다.</p>
          </div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["프로젝트 ID", "상태", "Readiness", "Gate 결과", "P0 위반", "Buyer-ready 후보", "액션"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const gCfg = GATE_CFG[p.gate_overall_status ?? "not_run"] ?? GATE_CFG.not_run;
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? "#0d1426" : "#0a0f1e" }}>
                      <td style={S.td}><code style={S.code}>{p.id.slice(0, 14)}…</code></td>
                      <td style={S.td}><span style={{ color: "#94a3b8", fontSize: 11 }}>{p.status}</span></td>
                      <td style={S.td}>
                        <div style={S.scoreBar}>
                          <div style={{ ...S.scoreFill, width: `${p.readiness_score ?? 0}%` }} />
                        </div>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{p.readiness_score ?? 0}</span>
                      </td>
                      <td style={S.td}><span style={{ color: gCfg.color, fontWeight: 700, fontSize: 11 }}>{gCfg.label}</span></td>
                      <td style={S.td}>
                        {p.has_p0_violation
                          ? <span style={{ color: "#fca5a5", fontWeight: 700 }}>✗ P0</span>
                          : <span style={{ color: "#86efac" }}>✓</span>}
                      </td>
                      <td style={S.td}>
                        {p.buyer_ready_eligible
                          ? <span style={{ color: "#86efac", fontWeight: 700 }}>✓ 승인 가능</span>
                          : <span style={{ color: "#475569" }}>—</span>}
                      </td>
                      <td style={S.td}>
                        <a href={`/im-projects/${p.id}/gate-review`} style={S.actionLink}>Gate 검토</a>
                        <a href={`/im-projects/${p.id}/export`} style={{ ...S.actionLink, marginLeft: 8 }}>Export</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" },
  header: { background: "#0d1426", borderBottom: "1px solid #1e293b", padding: "16px 28px" },
  hRow: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  breadcrumb: { fontSize: 11, color: "#475569", margin: "0 0 4px" },
  title: { fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#f1f5f9" },
  statsRow: { display: "flex", gap: 8 },
  alertTag: { background: "#450a0a", color: "#fca5a5", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 },
  okTag: { background: "#052e16", color: "#86efac", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 },
  muted: { color: "#475569", fontSize: 12, margin: 0 },
  backBtn: { background: "#1e293b", color: "#94a3b8", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" },
  body: { maxWidth: 1100, margin: "0 auto", padding: "20px 28px" },
  emptyCard: { textAlign: "center" as const, padding: "48px 32px", background: "#0d1426", border: "1px solid #1e293b", borderRadius: 12 },
  tableWrap: { overflowX: "auto" as const, border: "1px solid #1e293b", borderRadius: 8 },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { background: "#111827", color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "10px 14px", textAlign: "left" as const, borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" as const },
  td: { padding: "10px 14px", borderBottom: "1px solid #0d1426", verticalAlign: "middle" as const },
  code: { color: "#7dd3fc", fontSize: 11, fontFamily: "monospace" },
  scoreBar: { background: "#1e293b", borderRadius: 4, height: 4, width: 60, marginBottom: 2 },
  scoreFill: { height: 4, borderRadius: 4, background: "linear-gradient(90deg, #2563eb, #7c3aed)" },
  actionLink: { color: "#60a5fa", fontSize: 11, textDecoration: "none" },
};
