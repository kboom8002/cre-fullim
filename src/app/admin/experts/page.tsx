"use client";
import { useEffect, useState } from "react";

interface Assignment {
  id: string;
  project_id: string;
  section_type: string;
  expert_role: string;
  status: string;
  created_at: string;
  expert_id?: string;
}

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  assigned:  { color: "#7dd3fc", label: "배정됨" },
  submitted: { color: "#86efac", label: "제출됨" },
  approved:  { color: "#22c55e", label: "승인됨" },
  rejected:  { color: "#fca5a5", label: "거절됨" },
};

export default function AdminExpertsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/experts", { headers: { "x-actor-role": "admin" } })
      .then(r => r.json())
      .then(r => { if (r.ok) setAssignments(r.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const pending = assignments.filter(a => a.status === "assigned").length;

  return (
    <main style={S.main}>
      <header style={S.header}>
        <div style={S.hRow}>
          <div>
            <p style={S.breadcrumb}>Admin → 전문가 관리</p>
            <h1 style={S.title}>전문가 배정 현황</h1>
            {pending > 0 && <p style={{ color: "#fdba74", fontSize: 12, margin: "4px 0 0" }}>⚠ {pending}개 대기 중</p>}
          </div>
          <a href="/admin" style={S.backBtn}>← Admin 홈</a>
        </div>
      </header>
      <div style={S.body}>
        {loading ? <p style={S.muted}>로딩 중…</p> : assignments.length === 0 ? (
          <div style={S.emptyCard}>
            <p style={{ fontSize: 28, margin: "0 0 8px" }}>🔬</p>
            <p style={{ color: "#f1f5f9", fontWeight: 700, margin: "0 0 6px" }}>전문가 배정이 없습니다</p>
            <p style={S.muted}>전문가 검토 요청 시 배정 내역이 표시됩니다.</p>
          </div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["배정 ID", "섹션 유형", "전문가 역할", "상태", "생성일", "액션"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => {
                  const cfg = STATUS_CFG[a.status] ?? { color: "#64748b", label: a.status };
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? "#0d1426" : "#0a0f1e" }}>
                      <td style={S.td}><code style={S.code}>{a.id.slice(0, 14)}…</code></td>
                      <td style={S.td}><span style={S.chip}>{a.section_type?.replace(/_/g, " ") ?? "—"}</span></td>
                      <td style={S.td}><span style={{ color: "#a5b4fc", fontSize: 11 }}>{a.expert_role?.replace(/_/g, " ") ?? "—"}</span></td>
                      <td style={S.td}><span style={{ color: cfg.color, fontWeight: 700, fontSize: 11 }}>{cfg.label}</span></td>
                      <td style={S.td}><span style={S.muted}>{new Date(a.created_at).toLocaleDateString("ko-KR")}</span></td>
                      <td style={S.td}>
                        <a href={`/expert/assignments/${a.id}`} style={S.actionLink}>상세</a>
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
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: "#f1f5f9" },
  muted: { color: "#475569", fontSize: 12, margin: 0 },
  backBtn: { background: "#1e293b", color: "#94a3b8", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" },
  body: { maxWidth: 1100, margin: "0 auto", padding: "20px 28px" },
  emptyCard: { textAlign: "center" as const, padding: "48px 32px", background: "#0d1426", border: "1px solid #1e293b", borderRadius: 12 },
  tableWrap: { overflowX: "auto" as const, border: "1px solid #1e293b", borderRadius: 8 },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { background: "#111827", color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "10px 14px", textAlign: "left" as const, borderBottom: "1px solid #1e293b" },
  td: { padding: "10px 14px", borderBottom: "1px solid #0d1426", verticalAlign: "middle" as const },
  chip: { background: "#1e293b", color: "#94a3b8", borderRadius: 4, padding: "2px 6px", fontSize: 10 },
  code: { color: "#7dd3fc", fontSize: 11, fontFamily: "monospace" },
  actionLink: { color: "#60a5fa", fontSize: 11, textDecoration: "none" },
};
