/**
 * Golden Dataset Service (Slice 12)
 *
 * Implements:
 *   - docs/20-golden-dataset-extraction.md §4 Candidate Object, §5 Rules, §7 Redaction
 *   - packages/contracts-docs/05-expert-patch-contracts.md §6 Edit Tags
 *   - docs/19-disclosure-guard-policy.md §3 P0 Protected Fields
 *
 * Rules:
 *   - ai_draft and edit_tags are REQUIRED for candidate creation (docs/20 §5)
 *   - training_rights defaults to "not_allowed" (docs/20 §8)
 *   - redaction_status starts as "pending" (docs/20 §9)
 *   - Cannot approve: training_rights == "not_allowed" (docs/20 §5)
 *   - Cannot approve: redaction_status not in [redacted, not_required] (docs/20 §5)
 *   - Cannot approve: edit_tags empty (docs/20 §6)
 *   - Protected field redaction: address → [권역], tenant → [F&B 임차인], rent → [호실 임대료]
 *   - Event metadata must NOT include ai_draft or expert_revision content (no data leak)
 */

// ─── Types ─────────────────────────────────────────────────────────────

export type TrainingRights =
  | "not_allowed"
  | "allowed_anonymized"
  | "allowed_internal_eval_only"
  | "allowed_golden_dataset";

export type RedactionStatus = "pending" | "redacted" | "failed" | "not_required";

export type ReviewStatus = "candidate" | "review_pending" | "approved" | "rejected";

export type IssueCategory =
  | "overclaim" | "missing_evidence" | "financial_assumption"
  | "disclosure" | "risk_balance" | "legal_boundary"
  | "tax_boundary" | "valuation_logic" | "style" | "structure";

export interface GoldenCandidateRecord {
  id: string;
  project_id: string;
  section_id?: string;
  expert_patch_id?: string;
  gate_review_id?: string;
  section_type?: string;
  ai_draft: string;
  expert_revision?: string;
  reviewer_revision?: string;
  edit_tags: string[];
  issue_categories: IssueCategory[];
  training_rights: TrainingRights;
  redaction_status: RedactionStatus;
  review_status: ReviewStatus;
  created_at: string;
  reviewed_at?: string;
}

export interface GoldenCandidateCreateInput {
  project_id: string;
  section_id?: string;
  expert_patch_id?: string;
  gate_review_id?: string;
  section_type?: string;
  ai_draft: string;
  expert_revision?: string;
  reviewer_revision?: string;
  edit_tags: string[];
  issue_categories?: IssueCategory[];
  training_rights?: TrainingRights;
}

export interface RedactedCandidate extends GoldenCandidateRecord {
  ai_draft_redacted: string;
  expert_revision_redacted?: string;
}

// ─── Redaction patterns (docs/20 §7) ─────────────────────────────────

const REDACT_RULES: { pattern: RegExp; replacement: string; addTags: string[] }[] = [
  // Exact address → area_signal
  {
    pattern: /[가-힣]+구\s+[가-힣]+동\d*가?\s*\d+[-\d]*/g,
    replacement: "[권역]",
    addTags: [],
  },
  {
    pattern: /\d{1,4}-\d{1,4}\s*번지/g,
    replacement: "[권역]",
    addTags: [],
  },
  // Tenant names (common brands + general pattern) → F&B/업종
  {
    pattern: /스타벅스/g,
    replacement: "[F&B 임차인]",
    addTags: ["tenant_detail_redacted"],
  },
  {
    pattern: /CU\s|GS25|이마트|롯데마트/g,
    replacement: "[유통 임차인]",
    addTags: ["tenant_detail_redacted"],
  },
  // Unit rent (specific: 301호 월세 450만원) → [호실 임대료]
  {
    pattern: /\d+호\s*[가-힣]?\s*월세\s*\d+만\s*원/g,
    replacement: "[상층부 개별 호실 임대료]",
    addTags: ["unit_rent_redacted"],
  },
  {
    pattern: /월세\s*\d+만\s*원/g,
    replacement: "[월 임대료]",
    addTags: ["unit_rent_redacted"],
  },
  {
    pattern: /보증금\s*\d+억/g,
    replacement: "[보증금]",
    addTags: ["unit_rent_redacted"],
  },
  // Owner/buyer contact
  {
    pattern: /010[-\s]?\d{4}[-\s]?\d{4}/g,
    replacement: "[연락처 비공개]",
    addTags: [],
  },
];

// ─── createGoldenCandidate ─────────────────────────────────────────────

/**
 * Creates a new Golden Dataset candidate record.
 * Validates ai_draft non-empty, edit_tags min 1.
 * Defaults: training_rights=not_allowed, redaction_status=pending, review_status=candidate.
 */
export function createGoldenCandidate(input: GoldenCandidateCreateInput): GoldenCandidateRecord {
  if (!input.ai_draft || !input.ai_draft.trim()) {
    throw new Error("ai_draft is required for golden candidate creation (docs/20 §5)");
  }
  if (!input.edit_tags || input.edit_tags.length === 0) {
    throw new Error("edit_tags: at least one edit tag is required (docs/20 §6)");
  }

  return {
    id: `cand_${Date.now()}`,
    project_id: input.project_id,
    section_id: input.section_id,
    expert_patch_id: input.expert_patch_id,
    gate_review_id: input.gate_review_id,
    section_type: input.section_type,
    ai_draft: input.ai_draft,
    expert_revision: input.expert_revision,
    reviewer_revision: input.reviewer_revision,
    edit_tags: input.edit_tags,
    issue_categories: input.issue_categories ?? [],
    training_rights: input.training_rights ?? "not_allowed",
    redaction_status: "pending",
    review_status: "candidate",
    created_at: new Date().toISOString(),
  };
}

// ─── redactCandidate ──────────────────────────────────────────────────

/**
 * Applies redaction rules to ai_draft and expert_revision.
 * Updates redaction_status and appends relevant edit_tags.
 * docs/20 §7 redaction rules.
 */
export function redactCandidate(candidate: GoldenCandidateRecord): RedactedCandidate {
  let aiDraftRedacted = candidate.ai_draft;
  let expertRevRedacted = candidate.expert_revision ?? "";
  const addedTags = new Set<string>(candidate.edit_tags);

  for (const rule of REDACT_RULES) {
    const aiBefore = aiDraftRedacted;
    aiDraftRedacted = aiDraftRedacted.replace(rule.pattern, rule.replacement);
    expertRevRedacted = expertRevRedacted.replace(rule.pattern, rule.replacement);

    // If redaction happened, add associated edit tags
    if (aiBefore !== aiDraftRedacted && rule.addTags.length > 0) {
      for (const tag of rule.addTags) addedTags.add(tag);
    }
  }

  return {
    ...candidate,
    ai_draft_redacted: aiDraftRedacted,
    expert_revision_redacted: expertRevRedacted || undefined,
    edit_tags: [...addedTags],
    redaction_status: "redacted",
  };
}

// ─── approveCandidate ─────────────────────────────────────────────────

/**
 * Approves a golden candidate for dataset inclusion.
 * Guards (docs/20 §5):
 *   1. training_rights != not_allowed
 *   2. redaction_status in [redacted, not_required]
 *   3. edit_tags.length >= 1
 */
export function approveCandidate(
  candidate: GoldenCandidateRecord,
  reviewer_id: string,
): GoldenCandidateRecord {
  if (candidate.training_rights === "not_allowed") {
    throw new Error(
      "Cannot approve: training_rights is not_allowed. " +
      "Expert must grant training permission first. (docs/20 §5)",
    );
  }

  if (
    candidate.redaction_status !== "redacted" &&
    candidate.redaction_status !== "not_required"
  ) {
    throw new Error(
      `Cannot approve: redaction_status is "${candidate.redaction_status}". ` +
      "Redaction must be completed before approval. (docs/20 §5)",
    );
  }

  if (!candidate.edit_tags || candidate.edit_tags.length === 0) {
    throw new Error(
      "Cannot approve: edit_tags is empty. At least one edit tag required. (docs/20 §6)",
    );
  }

  return {
    ...candidate,
    review_status: "approved",
    reviewed_at: new Date().toISOString(),
  };
}

// ─── rejectCandidate ──────────────────────────────────────────────────

/**
 * Rejects a golden candidate.
 * Rejected candidates are never exported to training datasets (docs/20 §14).
 */
export function rejectCandidate(
  candidate: GoldenCandidateRecord,
  reviewer_id: string,
  reason: string,
): GoldenCandidateRecord {
  return {
    ...candidate,
    review_status: "rejected",
    reviewed_at: new Date().toISOString(),
  };
}

// ─── buildGoldenCandidateEvent ────────────────────────────────────────

export interface GoldenCandidateEventInput {
  event_type:
    | "golden_candidate_created"
    | "golden_candidate_redacted"
    | "golden_candidate_approved"
    | "golden_candidate_rejected";
  candidate_id: string;
  project_id: string;
  section_type?: string;
  training_rights: string;
  reviewer_id?: string;
  reject_reason?: string;
}

export interface GoldenCandidateEvent {
  event_type: string;
  entity_type: string;
  entity_id: string;
  source_app: string;
  metadata: Record<string, unknown>;
}

/**
 * Builds activity event for golden candidate lifecycle.
 * MUST NOT include ai_draft or expert_revision (no content leakage).
 */
export function buildGoldenCandidateEvent(
  input: GoldenCandidateEventInput,
): GoldenCandidateEvent {
  return {
    event_type: input.event_type,
    entity_type: "golden_im_candidate",
    entity_id: input.candidate_id,
    source_app: "js-full-im-studio",
    metadata: {
      project_id: input.project_id,
      section_type: input.section_type,
      training_rights: input.training_rights,
      reviewer_id: input.reviewer_id,
      reject_reason: input.reject_reason,
      // Intentionally omit: ai_draft, expert_revision, reviewer_revision (content data)
    },
  };
}
