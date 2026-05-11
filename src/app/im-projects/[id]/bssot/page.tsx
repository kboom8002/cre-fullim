"use client";

import { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────

interface LayerSummaryItem {
  layer: string;
  has_data: boolean;
  source: string | null;
}

interface MissingDataItem {
  field: string;
  required_for: string;
  reason: string;
}

interface EvidenceRef {
  type: string;
  id: string;
  visibility?: string;
}

interface BSSoTFullData {
  id: string;
  readiness_status: string;
  asset_identity: Record<string, unknown>;
  physical_fact: Record<string, unknown>;
  lease_income: Record<string, unknown>;
  buyer_fit: Record<string, unknown>;
  risk_unknown: Record<string, unknown>;
  disclosure_gate: Record<string, unknown>;
  evidence_source: {
    source_refs: Array<{ type: string; id: string; source?: string }>;
    evidence_refs: EvidenceRef[];
  };
  [key: string]: unknown;
}

interface BSSoTPageData {
  project_id: string;
  project_status: string;
  bssot_full: BSSoTFullData;
  layer_summary: LayerSummaryItem[];
  missing_data: MissingDataItem[];
  protected_fields: string[];
  readiness_status: string;
}

// ─── Layer label map ───────────────────────────────────────────────────

const LAYER_LABELS: Record<string, string> = {
  asset_identity: "자산 개요",
  physical_fact: "물리적 사실",
  legal_registry: "법적 등기",
  lease_income: "임대·수익",
  market_location: "시장·입지",
  value_up_hypothesis: "가치상승 가설",
  risk_unknown: "리스크·불명",
  buyer_fit: "매수자 적합성",
  disclosure_gate: "공개 기준",
  evidence_source: "증거·출처",
  b2c_consumer_demand: "소비자 수요",
  space_environmental: "공간·환경",
  tenant_operator_management: "임차인·운영",
  ai_answer_document_contract: "AI 답변 계약",
};

const MISSING_FOR_LABELS: Record<string, string> = {
  required_for_im_lite: "IM 간이본 필수",
  required_for_full_im_draft: "전문 IM 초안 필수",
  required_for_buyer_ready: "매수자용 최종본 필수",
  optional_enrichment: "선택 보완",
};

const MISSING_FOR_COLORS: Record<string, string> = {
  required_for_im_lite: "#ef4444",
  required_for_full_im_draft: "#f97316",
  required_for_buyer_ready: "#eab308",
  optional_enrichment: "#6b7280",
};

const READINESS_LABELS: Record<string, string> = {
  lite_imported: "라이트 임포트 완료",
  needs_data: "데이터 보완 필요",
  im_lite_ready: "IM 간이본 준비됨",
  full_im_draft_ready: "전문 IM 초안 준비됨",
  buyer_ready_candidate: "매수자용 후보",
};

// ─── Component ────────────────────────────────────────────────────────

export default function BSSoTPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [data, setData] = useState<BSSoTPageData | null>(null);
  const [activeLayer, setActiveLayer] = useState<string>("asset_identity");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setProjectId(id));
  }, [params]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/im-projects/${projectId}/bssot`)
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) setData(r.data);
        else setError(r.message ?? "오류가 발생했습니다.");
      })
      .catch(() => setError("서버 연결 오류"))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const activeLayerData = (data.bssot_full[activeLayer] ?? {}) as Record<string, unknown>;

  return (
    <main style={styles.main}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <a href={`/im-projects/${data.project_id}`} style={styles.backLink}>
              ← IM 프로젝트
            </a>
            <h1 style={styles.title}>Building SSoT Full</h1>
            <p style={styles.subtitle}>
              프로젝트 <code style={styles.code}>{data.project_id.slice(0, 8)}…</code>
            </p>
          </div>
          <ReadinessBadge status={data.readiness_status} />
        </div>
      </header>

      <div style={styles.body}>
        {/* Left: Layer navigation */}
        <nav style={styles.nav}>
          <p style={styles.navTitle}>데이터 레이어</p>
          {data.layer_summary.map((item) => (
            <button
              key={item.layer}
              onClick={() => setActiveLayer(item.layer)}
              style={{
                ...styles.navBtn,
                ...(activeLayer === item.layer ? styles.navBtnActive : {}),
              }}
            >
              <span style={styles.navDot(item.has_data)} />
              <span>{LAYER_LABELS[item.layer] ?? item.layer}</span>
              {item.source && (
                <span style={styles.navSource}>{item.source}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Center: Layer detail */}
        <section style={styles.center}>
          <div style={styles.layerHeader}>
            <h2 style={styles.layerTitle}>
              {LAYER_LABELS[activeLayer] ?? activeLayer}
            </h2>
            <span style={styles.layerBadge}>
              {(activeLayerData as Record<string, unknown>)._source
                ? `출처: ${(activeLayerData as Record<string, unknown>)._source}`
                : "출처 미확인"}
            </span>
          </div>

          <LayerContent layer={activeLayer} data={activeLayerData} />

          {/* Evidence refs for evidence_source layer */}
          {activeLayer === "evidence_source" && (
            <EvidenceSection bssotFull={data.bssot_full} />
          )}

          {/* Protected fields for disclosure_gate layer */}
          {activeLayer === "disclosure_gate" && (
            <ProtectedFieldsSection fields={data.protected_fields} />
          )}
        </section>

        {/* Right: Missing data */}
        <aside style={styles.aside}>
          <h3 style={styles.asideTitle}>누락 데이터</h3>
          <p style={styles.asideSubtitle}>
            {data.missing_data.length}개 항목 확인 필요
          </p>
          {data.missing_data.map((item) => (
            <MissingDataCard key={item.field} item={item} />
          ))}
        </aside>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function ReadinessBadge({ status }: { status: string }) {
  const label = READINESS_LABELS[status] ?? status;
  const isReady = status.includes("ready") || status === "buyer_ready_candidate";
  return (
    <div style={{ ...styles.badge, background: isReady ? "#166534" : "#1e3a5f" }}>
      {label}
    </div>
  );
}

function LayerContent({
  layer,
  data,
}: {
  layer: string;
  data: Record<string, unknown>;
}) {
  const visible = Object.entries(data).filter(([k]) => !k.startsWith("_"));
  if (visible.length === 0) {
    return (
      <div style={styles.emptyLayer}>
        <p style={styles.emptyText}>이 레이어는 아직 데이터가 없습니다.</p>
        <p style={styles.emptyHint}>
          수동 입력, 서류 업로드, 또는 전문가 패치를 통해 채울 수 있습니다.
        </p>
      </div>
    );
  }

  // Special render for risk_items
  if (layer === "risk_unknown" && Array.isArray(data.risk_items)) {
    return (
      <div style={styles.fieldList}>
        {(data.risk_items as Array<{ description: string; source: string; confidence: string }>).map(
          (item, i) => (
            <div key={i} style={styles.riskCard}>
              <span style={styles.riskIcon}>⚠️</span>
              <div>
                <p style={styles.riskDesc}>{item.description}</p>
                <p style={styles.riskMeta}>
                  출처: {item.source} | 신뢰도: {item.confidence}
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    );
  }

  return (
    <div style={styles.fieldList}>
      {visible.map(([key, value]) => (
        <div key={key} style={styles.fieldRow}>
          <span style={styles.fieldKey}>{key}</span>
          <span style={styles.fieldValue}>
            {value === null ? (
              <span style={styles.nullValue}>— 미입력</span>
            ) : Array.isArray(value) ? (
              value.length === 0 ? (
                <span style={styles.nullValue}>— 없음</span>
              ) : (
                <span>{JSON.stringify(value)}</span>
              )
            ) : (
              String(value)
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function EvidenceSection({ bssotFull }: { bssotFull: BSSoTFullData }) {
  const sourceRefs = bssotFull.evidence_source?.source_refs ?? [];
  const evidenceRefs = bssotFull.evidence_source?.evidence_refs ?? [];

  return (
    <div style={styles.evidenceSection}>
      <h3 style={styles.evidenceTitle}>출처 참조 (Source Refs)</h3>
      {sourceRefs.length === 0 ? (
        <p style={styles.emptyText}>출처 참조 없음</p>
      ) : (
        sourceRefs.map((ref, i) => (
          <div key={i} style={styles.refCard}>
            <span style={styles.refType}>{ref.type}</span>
            <code style={styles.refId}>{ref.id}</code>
            {ref.source && <span style={styles.refSource}>({ref.source})</span>}
          </div>
        ))
      )}

      <h3 style={{ ...styles.evidenceTitle, marginTop: 24 }}>증거 참조 (Evidence Refs)</h3>
      {evidenceRefs.length === 0 ? (
        <p style={styles.emptyText}>증거 참조 없음</p>
      ) : (
        evidenceRefs.map((ref, i) => (
          <div key={i} style={styles.refCard}>
            <span style={styles.refType}>{ref.type}</span>
            <code style={styles.refId}>{ref.id}</code>
            {ref.visibility && (
              <span style={styles.visibilityTag}>{ref.visibility}</span>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function ProtectedFieldsSection({ fields }: { fields: string[] }) {
  return (
    <div style={styles.protectedSection}>
      <h3 style={styles.evidenceTitle}>보호 필드 분류</h3>
      {fields.length === 0 ? (
        <p style={styles.emptyText}>지정된 보호 필드 없음</p>
      ) : (
        <div style={styles.fieldList}>
          {fields.map((field) => (
            <div key={field} style={styles.protectedField}>
              <span style={styles.protectedIcon}>🔒</span>
              <span style={styles.protectedName}>{field}</span>
              <span style={styles.protectedLabel}>internal_only 이상 필요</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MissingDataCard({ item }: { item: MissingDataItem }) {
  const color = MISSING_FOR_COLORS[item.required_for] ?? "#6b7280";
  const label = MISSING_FOR_LABELS[item.required_for] ?? item.required_for;
  return (
    <div style={styles.missingCard}>
      <div style={styles.missingTop}>
        <code style={styles.missingField}>{item.field}</code>
        <span style={{ ...styles.missingBadge, background: color }}>{label}</span>
      </div>
      <p style={styles.missingReason}>{item.reason}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>BSSoT 데이터 로딩 중…</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={styles.centered}>
      <p style={styles.errorText}>오류: {message}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const styles = {
  main: {
    minHeight: "100vh",
    background: "#0a0f1e",
    color: "#e2e8f0",
    fontFamily: "'Inter', 'Noto Sans KR', sans-serif",
  } as React.CSSProperties,
  header: {
    borderBottom: "1px solid #1e293b",
    padding: "24px 32px",
    background: "#0d1426",
  } as React.CSSProperties,
  headerContent: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  } as React.CSSProperties,
  backLink: {
    color: "#64748b",
    textDecoration: "none",
    fontSize: 13,
    display: "block",
    marginBottom: 8,
  } as React.CSSProperties,
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: "0 0 4px",
    color: "#f1f5f9",
  } as React.CSSProperties,
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: 0,
  } as React.CSSProperties,
  code: {
    fontFamily: "monospace",
    color: "#94a3b8",
  } as React.CSSProperties,
  badge: {
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
  } as React.CSSProperties,
  body: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "220px 1fr 320px",
    gap: 0,
    minHeight: "calc(100vh - 100px)",
  } as React.CSSProperties,

  // Navigation
  nav: {
    borderRight: "1px solid #1e293b",
    padding: "20px 0",
    background: "#0d1426",
  } as React.CSSProperties,
  navTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    color: "#475569",
    letterSpacing: "0.08em",
    padding: "0 16px 12px",
    margin: 0,
  } as React.CSSProperties,
  navBtn: {
    width: "100%",
    padding: "9px 16px",
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left" as const,
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.15s",
  } as React.CSSProperties,
  navBtnActive: {
    background: "#1e293b",
    color: "#f1f5f9",
    borderLeft: "3px solid #3b82f6",
  } as React.CSSProperties,
  navDot: (hasData: boolean) =>
    ({
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: hasData ? "#22c55e" : "#334155",
      flexShrink: 0,
    }) as React.CSSProperties,
  navSource: {
    marginLeft: "auto",
    fontSize: 10,
    color: "#475569",
    fontFamily: "monospace",
  } as React.CSSProperties,

  // Center
  center: {
    padding: "24px 32px",
    overflowY: "auto" as const,
  } as React.CSSProperties,
  layerHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  } as React.CSSProperties,
  layerTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: "#f1f5f9",
  } as React.CSSProperties,
  layerBadge: {
    background: "#1e293b",
    color: "#64748b",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 12,
  } as React.CSSProperties,
  fieldList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  } as React.CSSProperties,
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    background: "#111827",
    borderRadius: 8,
    padding: "10px 14px",
    gap: 16,
  } as React.CSSProperties,
  fieldKey: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#7dd3fc",
    flexShrink: 0,
  } as React.CSSProperties,
  fieldValue: {
    fontSize: 14,
    color: "#cbd5e1",
    textAlign: "right" as const,
  } as React.CSSProperties,
  nullValue: {
    color: "#475569",
    fontStyle: "italic",
  } as React.CSSProperties,
  emptyLayer: {
    background: "#111827",
    borderRadius: 12,
    padding: "32px 24px",
    textAlign: "center" as const,
    border: "1px dashed #1e293b",
  } as React.CSSProperties,
  emptyText: {
    color: "#475569",
    margin: "0 0 8px",
    fontSize: 14,
  } as React.CSSProperties,
  emptyHint: {
    color: "#334155",
    fontSize: 13,
    margin: 0,
  } as React.CSSProperties,

  // Risk
  riskCard: {
    background: "#1a0a0a",
    border: "1px solid #7f1d1d",
    borderRadius: 8,
    padding: "12px 14px",
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  } as React.CSSProperties,
  riskIcon: { fontSize: 16, flexShrink: 0 } as React.CSSProperties,
  riskDesc: { color: "#fca5a5", margin: 0, fontSize: 14 } as React.CSSProperties,
  riskMeta: { color: "#6b7280", fontSize: 12, margin: "4px 0 0" } as React.CSSProperties,

  // Evidence
  evidenceSection: { marginTop: 24 } as React.CSSProperties,
  evidenceTitle: { fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 12 } as React.CSSProperties,
  refCard: {
    background: "#111827",
    borderRadius: 8,
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  } as React.CSSProperties,
  refType: { fontSize: 12, color: "#64748b", background: "#1e293b", borderRadius: 4, padding: "2px 7px" } as React.CSSProperties,
  refId: { fontFamily: "monospace", fontSize: 13, color: "#7dd3fc", flexGrow: 1 } as React.CSSProperties,
  refSource: { fontSize: 12, color: "#475569" } as React.CSSProperties,
  visibilityTag: { fontSize: 11, color: "#fbbf24", background: "#451a03", borderRadius: 4, padding: "2px 6px" } as React.CSSProperties,

  // Protected fields
  protectedSection: { marginTop: 24 } as React.CSSProperties,
  protectedField: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#0a0a1a",
    border: "1px solid #1e1b4b",
    borderRadius: 8,
    padding: "8px 12px",
    marginBottom: 6,
  } as React.CSSProperties,
  protectedIcon: { fontSize: 14 } as React.CSSProperties,
  protectedName: { fontFamily: "monospace", fontSize: 13, color: "#a5b4fc", flexGrow: 1 } as React.CSSProperties,
  protectedLabel: { fontSize: 11, color: "#6366f1", background: "#1e1b4b", borderRadius: 4, padding: "2px 7px" } as React.CSSProperties,

  // Aside
  aside: {
    borderLeft: "1px solid #1e293b",
    padding: "20px 18px",
    background: "#0d1426",
    overflowY: "auto" as const,
  } as React.CSSProperties,
  asideTitle: { fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px" } as React.CSSProperties,
  asideSubtitle: { fontSize: 12, color: "#64748b", margin: "0 0 16px" } as React.CSSProperties,
  missingCard: {
    background: "#111827",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 8,
    border: "1px solid #1e293b",
  } as React.CSSProperties,
  missingTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 } as React.CSSProperties,
  missingField: { fontFamily: "monospace", fontSize: 12, color: "#7dd3fc" } as React.CSSProperties,
  missingBadge: { borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 600, color: "#fff", flexShrink: 0 } as React.CSSProperties,
  missingReason: { fontSize: 12, color: "#64748b", margin: 0 } as React.CSSProperties,

  // States
  centered: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0f1e",
    color: "#e2e8f0",
  } as React.CSSProperties,
  spinner: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "3px solid #1e293b",
    borderTopColor: "#3b82f6",
    animation: "spin 0.8s linear infinite",
    marginBottom: 16,
  } as React.CSSProperties,
  loadingText: { color: "#64748b", fontSize: 14, margin: 0 } as React.CSSProperties,
  errorText: { color: "#ef4444", fontSize: 16 } as React.CSSProperties,
};
