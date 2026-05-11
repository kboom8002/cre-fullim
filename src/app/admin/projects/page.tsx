"use client";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  status: string;
  target_output: string;
  readiness_score: number;
  created_at: string;
  created_by: string;
}

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  created:          { color: "#94a3b8", label: "생성됨" },
  readiness_checked:{ color: "#7dd3fc", label: "Readiness 완료" },
  outline_generated:{ color: "#a5b4fc", label: "아웃라인 생성" },
  ai_draft:         { color: "#c4b5fd", label: "AI 초안" },
  patched:          { color: "#fdba74", label: "전문가 패치" },
  gate_review:      { color: "#fb923c", label: "Gate 검토 중" },
  buyer_ready:      { color: "#86efac", label: "Buyer-ready" },
  blocked:          { color: "#fca5a5", label: "차단됨" },
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/projects", { headers: { "x-actor-role": "admin" } })
      .then(r => r.json())
      .then(r => { if (r.ok) setProjects(r.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);
  const statuses = [...new Set(projects.map(p => p.status))];

  return (
    <main style={S.main}>
      <header style={S.header}>
        <div style={S.hRow}>
          <div>
            <p style={S.breadcrumb}>Admin → 프로젝트 목록</p>
            <h1 style={S.title}>전체 IM 프로젝트</h1>
          </div>
          <a href="/admin" style={{ ...S.btn, textDecoration: "none" }}>← Admin 홈</a>
        </div>
      </header>
      <div style={S.body}>
        <div style={S.filterBar}>
          <button onClick={() => setFilter("all")} style={{ ...S.filterBtn, ...(filter === "all" ? S.filterActive : {}) }}>
            전체 ({projects.length})
          </button>
          {statuses.map(s => {
            const cfg = STATUS_CFG[s] ?? { color: "#64748b", label: s };
            return (
              <button key={s} onClick={() => setFilter(s)}
                style={{ ...S.filterBtn, ...(filter === s ? S.filterActive : {}), borderColor: cfg.color + "44" }}>
                <span style={{ color: cfg.color }}>●</span> {cfg.label} ({projects.filter(p => p.status === s).length})
              </button>
            );
          })}
        </div>

        {loading ? <p style={S.muted}>로딩 중…</p> : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["프로젝트 ID", "상태", "목표 출력", "Readiness", "생성일", "액션"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const cfg = STATUS_CFG[p.status] ?? { color: "#64748b", label: p.status };
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? "#0d1426" : "#0a0f1e" }}>
                      <td style={S.td}><code style={S.code}>{p.id.slice(0, 16)}…</code></td>
                      <td style={S.td}><span style={{ color: cfg.color, fontWeight: 700, fontSize: 11 }}>{cfg.label}</span></td>
                      <td style={S.td}><span style={S.chip}>{(p.target_output ?? "—").replace(/_/g, " ")}</span></td>
                      <td style={S.td}>
                        <div style={S.scoreBar}>
                          <div style={{ ...S.scoreBarFill, width: `${p.readiness_score ?? 0}%` }} />
                        </div>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{p.readiness_score ?? 0}</span>
                      </td>
                      <td style={S.td}><span style={S.muted}>{new Date(p.created_at).toLocaleDateString("ko-KR")}</span></td>
                      <td style={S.td}>
                        <a href={`/im-projects/${p.id}`} style={S.actionLink}>보기</a>
                        <a href={`/im-projects/${p.id}/gate-review`} style={{ ...S.actionLink, marginLeft: 6 }}>Gate</a>
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
  hRow: { maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  breadcrumb: { fontSize: 11, color: "#475569", margin: "0 0 4px" },
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: "#f1f5f9" },
  muted: { color: "#475569", fontSize: 12, margin: 0 },
  btn: { background: "#1e293b", color: "#94a3b8", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" },
  body: { maxWidth: 1200, margin: "0 auto", padding: "20px 28px" },
  filterBar: { display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 14 },
  filterBtn: { borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #1e293b", background: "#0d1426", color: "#64748b", display: "flex", alignItems: "center", gap: 4 },
  filterActive: { background: "#1e293b", color: "#f1f5f9" },
  tableWrap: { overflowX: "auto" as const, border: "1px solid #1e293b", borderRadius: 8 },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { background: "#111827", color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "10px 14px", textAlign: "left" as const, borderBottom: "1px solid #1e293b" },
  td: { padding: "10px 14px", borderBottom: "1px solid #0d1426", verticalAlign: "middle" as const },
  chip: { background: "#1e293b", color: "#94a3b8", borderRadius: 4, padding: "2px 6px", fontSize: 10 },
  code: { color: "#7dd3fc", fontSize: 11, fontFamily: "monospace" },
  scoreBar: { background: "#1e293b", borderRadius: 4, height: 4, width: 80, marginBottom: 2 },
  scoreBarFill: { height: 4, borderRadius: 4, background: "linear-gradient(90deg, #2563eb, #7c3aed)" },
  actionLink: { color: "#60a5fa", fontSize: 11, textDecoration: "none" },
};
