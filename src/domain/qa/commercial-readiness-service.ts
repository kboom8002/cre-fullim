/**
 * Commercial Readiness Service (Slice 14)
 *
 * Implements:
 *   - docs/34-commercial-readiness-checklist.md §13 Pilot Readiness Score
 *
 * Rules:
 *   - Score 20 items, each 0 or 1 (boolean)
 *   - Pilot threshold: total >= 16/20
 *   - p0_disclosure_issue === true → not_pilot_ready regardless of score
 *   - buyer_ready_guard_works must be true for pilot readiness
 */

// ─── Types ─────────────────────────────────────────────────────────────

export interface CommercialReadinessInput {
  // Product flow (docs/34 §2)
  handoff_import: boolean;
  bssot_full_created: boolean;
  readiness_score_shown: boolean;
  outline_18_sections: boolean;
  ai_draft_works: boolean;
  section_editor_usable: boolean;
  expert_workbench_usable: boolean;
  gate_review_blocks_unsafe: boolean;
  export_preview_works: boolean;
  disclaimer_included: boolean;

  // Safety & Disclosure (docs/34 §4, §5)
  ai_safety_validated: boolean;
  disclosure_guard_active: boolean;

  // Expert workflow (docs/34 §6)
  expert_patch_auditable: boolean;

  // Gate & Audit (docs/34 §7, §10)
  gate_events_recorded: boolean;
  buyer_ready_guard_works: boolean;
  admin_analytics_visible: boolean;

  // UX (docs/34 §11)
  empty_states_helpful: boolean;
  error_states_safe: boolean;
  next_best_action_shown: boolean;
  loading_states_exist: boolean;

  // P0 explicit blocker
  p0_disclosure_issue?: boolean;
}

export interface PilotReadinessScore {
  total: number;           // 0-20
  max: number;             // 20
  is_pilot_ready: boolean; // total >= 16 AND !p0
  p0_disclosure_issue: boolean;
  buyer_ready_guard_works: boolean;
  breakdown: Record<string, boolean>;
  failing_items: string[];
}

// ─── computePilotReadinessScore ───────────────────────────────────────

const CHECKLIST_KEYS: (keyof Omit<CommercialReadinessInput, "p0_disclosure_issue">)[] = [
  "handoff_import",
  "bssot_full_created",
  "readiness_score_shown",
  "outline_18_sections",
  "ai_draft_works",
  "section_editor_usable",
  "expert_workbench_usable",
  "gate_review_blocks_unsafe",
  "export_preview_works",
  "disclaimer_included",
  "ai_safety_validated",
  "disclosure_guard_active",
  "expert_patch_auditable",
  "gate_events_recorded",
  "buyer_ready_guard_works",
  "admin_analytics_visible",
  "empty_states_helpful",
  "error_states_safe",
  "next_best_action_shown",
  "loading_states_exist",
];

const ITEM_LABELS: Record<string, string> = {
  handoff_import:             "MVP 핸드오프 임포트",
  bssot_full_created:         "Full B-SSoT 생성",
  readiness_score_shown:      "Readiness 점수 표시",
  outline_18_sections:        "18섹션 아웃라인 생성",
  ai_draft_works:             "AI 초안 생성 동작",
  section_editor_usable:      "섹션 에디터 사용 가능",
  expert_workbench_usable:    "전문가 워크벤치 사용 가능",
  gate_review_blocks_unsafe:  "Gate 검토 안전하지 않은 출력 차단",
  export_preview_works:       "Export 미리보기 동작",
  disclaimer_included:        "면책 문구 포함",
  ai_safety_validated:        "AI 안전성 검증",
  disclosure_guard_active:    "공시 가드 활성화",
  expert_patch_auditable:     "전문가 패치 감사 가능",
  gate_events_recorded:       "Gate 이벤트 기록",
  buyer_ready_guard_works:    "Buyer-ready 가드 동작",
  admin_analytics_visible:    "Admin 분석 화면 표시",
  empty_states_helpful:       "빈 상태 안내 표시",
  error_states_safe:          "오류 상태 안전 처리",
  next_best_action_shown:     "다음 최선 액션 표시",
  loading_states_exist:       "로딩 상태 표시",
};

/**
 * Computes pilot readiness score from commercial readiness checklist.
 * docs/34 §13: threshold 16/20, no P0, buyer_ready_guard required.
 */
export function computePilotReadinessScore(input: CommercialReadinessInput): PilotReadinessScore {
  const breakdown: Record<string, boolean> = {};
  const failingItems: string[] = [];
  let total = 0;

  for (const key of CHECKLIST_KEYS) {
    const val = Boolean(input[key]);
    breakdown[key] = val;
    if (val) {
      total++;
    } else {
      failingItems.push(ITEM_LABELS[key] ?? key);
    }
  }

  const p0 = Boolean(input.p0_disclosure_issue);
  const buyerGuard = Boolean(input.buyer_ready_guard_works);

  // Pilot threshold: 16/20 AND no P0 AND buyer guard works
  const is_pilot_ready = total >= 16 && !p0 && buyerGuard;

  return {
    total,
    max: 20,
    is_pilot_ready,
    p0_disclosure_issue: p0,
    buyer_ready_guard_works: buyerGuard,
    breakdown,
    failing_items: failingItems,
  };
}

// ─── UX State helpers ─────────────────────────────────────────────────

export interface LoadingState {
  is_loading: boolean;
  message: string;
  show_skeleton: boolean;
}

export interface EmptyState {
  title: string;
  description: string;
  cta_label?: string;
  cta_url?: string;
  icon: string;
}

export interface ErrorState {
  title: string;
  description: string;
  is_safe: boolean;        // no private data leaked
  retry_available: boolean;
  support_action?: string;
}

/** Standard loading state for long AI operations */
export function makeLoadingState(operation: string): LoadingState {
  return {
    is_loading: true,
    message: `${operation} 처리 중입니다. 잠시 기다려주세요…`,
    show_skeleton: true,
  };
}

/** Standard empty state for common entities */
export function makeEmptyState(entity: "sections" | "expert_patches" | "gate_results" | "qna_pack" | "golden_candidates" | "projects"): EmptyState {
  const EMPTY_CFG: Record<string, EmptyState> = {
    sections: {
      title: "섹션이 없습니다",
      description: "아웃라인을 생성하면 18개 섹션이 자동으로 만들어집니다.",
      cta_label: "아웃라인 생성",
      icon: "📋",
    },
    expert_patches: {
      title: "전문가 패치가 없습니다",
      description: "전문가 검토 요청을 통해 패치를 받을 수 있습니다.",
      icon: "🔬",
    },
    gate_results: {
      title: "Gate 검토 결과가 없습니다",
      description: "Gate 검토를 실행하여 Buyer-ready 가능 여부를 확인하세요.",
      cta_label: "Gate 검토 실행",
      icon: "🔍",
    },
    qna_pack: {
      title: "Q&A Pack이 없습니다",
      description: "Q&A Pack 생성 버튼을 클릭하여 예상 질문 목록을 만드세요.",
      cta_label: "Q&A Pack 생성",
      icon: "💬",
    },
    golden_candidates: {
      title: "Golden Dataset 후보가 없습니다",
      description: "전문가 패치가 제출되면 자동으로 후보가 생성됩니다.",
      icon: "🏆",
    },
    projects: {
      title: "IM 프로젝트가 없습니다",
      description: "MVP에서 핸드오프 요청을 보내면 프로젝트가 생성됩니다.",
      icon: "📁",
    },
  };

  return EMPTY_CFG[entity] ?? { title: "데이터가 없습니다", description: "아직 데이터가 없습니다.", icon: "📭" };
}

/** Safe error state — never exposes private data */
export function makeErrorState(code: string, retry = true): ErrorState {
  const ERRORS: Record<string, Omit<ErrorState, "is_safe" | "retry_available">> = {
    EXPORT_BLOCKED: {
      title: "내보내기 차단됨",
      description: "이 프로젝트는 현재 내보내기가 차단되어 있습니다. Gate 검토 결과를 확인하세요.",
    },
    GATE_FAILED: {
      title: "Gate 검토 실패",
      description: "Gate 검토 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    },
    NOT_FOUND: {
      title: "페이지를 찾을 수 없습니다",
      description: "요청한 리소스가 존재하지 않거나 접근 권한이 없습니다.",
    },
    FORBIDDEN: {
      title: "접근 권한 없음",
      description: "이 작업을 수행할 권한이 없습니다. 관리자에게 문의하세요.",
    },
    AI_FAILED: {
      title: "AI 생성 실패",
      description: "AI 초안 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    },
    INTERNAL_ERROR: {
      title: "처리 중 오류 발생",
      description: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    },
  };

  const cfg = ERRORS[code] ?? ERRORS.INTERNAL_ERROR;

  return {
    ...cfg,
    is_safe: true,   // Always true — we never expose private data in error messages
    retry_available: retry,
  };
}
