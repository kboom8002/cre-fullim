import { z } from "zod";

// 1. Common Types
export const SourceRefSchema = z.object({
  id: z.string(),
  source_type: z.enum([
    "user_input", "public_data", "uploaded_file", "broker_memo",
    "expert_patch", "ai_inference", "external_api"
  ]),
  source_label: z.string(),
  source_uri: z.string().optional(),
  captured_at: z.string().datetime().optional(),
  confidence: z.enum(["confirmed", "inferred", "needs_evidence", "unknown"]),
});

export const EvidenceRefSchema = z.object({
  id: z.string(),
  evidence_type: z.enum([
    "building_register", "registry", "land_use_plan", "lease_summary",
    "rent_roll", "photo", "floor_plan", "repair_history",
    "market_comp", "rent_comp", "expert_memo", "other"
  ]),
  title: z.string(),
  storage_path: z.string().optional(),
  visibility: z.enum([
    "public", "public_blind", "gate_restricted", "internal_only",
    "private_truth", "blocked"
  ]),
  review_status: z.enum(["uploaded", "reviewed", "buyer_ready", "internal_only", "blocked"]),
});

// 2. BuildingSSoTFull
export const BuildingSSoTFullSchema = z.object({
  id: z.string(),
  source_building_ssot_lite_id: z.string().optional(),
  created_by: z.string(),

  asset_identity: z.object({
    display_name: z.string().optional(),
    exact_address: z.string().optional(),
    area_signal: z.string().optional(),
    parcel_number: z.string().optional(),
    asset_type: z.string().optional(),
    disclosure_name: z.string().optional()
  }).default({} as any),

  physical_fact: z.object({
    land_area: z.number().optional(),
    gross_floor_area: z.number().optional(),
    building_area: z.number().optional(),
    floors: z.string().optional(),
    structure: z.string().optional(),
    main_use: z.string().optional(),
    completion_year: z.number().optional(),
    parking: z.string().optional(),
    elevator: z.string().optional()
  }).default({} as any),

  legal_registry: z.object({
    zoning: z.string().optional(),
    land_use: z.string().optional(),
    registry_summary: z.string().optional(),
    violation_status: z.string().optional(),
    legal_notes: z.array(z.string()).default([])
  }).default({} as any),

  lease_income: z.object({
    rent_roll_summary: z.string().optional(),
    monthly_rent_total: z.number().optional(),
    deposit_total: z.number().optional(),
    vacancy_summary: z.string().optional(),
    lease_quality_notes: z.array(z.string()).default([])
  }).default({} as any),

  market_location: z.object({
    access_summary: z.string().optional(),
    micro_market_summary: z.string().optional(),
    demand_signals: z.array(z.string()).default([]),
    comp_notes: z.array(z.string()).default([])
  }).default({} as any),

  value_up_hypothesis: z.object({
    scenarios: z.array(z.object({
      title: z.string(),
      hypothesis: z.string(),
      required_validation: z.array(z.string()).default([]),
      risk_notes: z.array(z.string()).default([])
    })).default([])
  }).default({} as any),

  risk_unknown: z.object({
    risk_items: z.array(z.object({
      category: z.string(),
      risk: z.string(),
      evidence_needed: z.array(z.string()).default([]),
      expert_required: z.boolean().default(false)
    })).default([])
  }).default({} as any),

  buyer_fit: z.object({
    fit_types: z.array(z.string()).default([]),
    misfit_types: z.array(z.string()).default([]),
    buyer_messages: z.array(z.string()).default([])
  }).default({} as any),

  disclosure_gate: z.object({
    protected_fields: z.array(z.string()).default([]),
    allowed_visibility: z.array(z.string()).default([]),
    gate_notes: z.array(z.string()).default([])
  }).default({} as any),

  evidence_source: z.object({
    source_refs: z.array(SourceRefSchema).default([]),
    evidence_refs: z.array(EvidenceRefSchema).default([])
  }).default({} as any),

  b2c_consumer_demand: z.record(z.string(), z.any()).default({}),
  space_environmental: z.record(z.string(), z.any()).default({}),
  tenant_operator_management: z.record(z.string(), z.any()).default({}),
  ai_answer_document_contract: z.record(z.string(), z.any()).default({}),

  readiness_status: z.enum(["lite_imported", "needs_data", "im_lite_ready", "full_im_draft_ready", "buyer_ready_candidate"]).default("lite_imported"),

  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional()
});
export type BuildingSSoTFull = z.infer<typeof BuildingSSoTFullSchema>;

// 3. IMProject
export const IMProjectTypeSchema = z.enum([
  "ai_self_authoring",
  "ai_expert_review",
  "expert_full_build",
  "dealroom_ready_package"
]);

export const IMProjectStatusSchema = z.enum([
  "intake", "ssot_building", "readiness_checked", "outline_generated",
  "ai_draft", "expert_patch", "gate_review", "client_review",
  "buyer_ready", "exported", "dealroom_published", "archived", "blocked"
]);

export const IMProjectSchema = z.object({
  id: z.string(),
  source_app: z.enum(["js-building-ssot-mvp", "js-full-im-studio", "manual"]),
  source_building_ssot_lite_id: z.string().optional(),
  building_ssot_full_id: z.string(),
  created_by: z.string(),
  project_owner_id: z.string().optional(),
  project_type: IMProjectTypeSchema,
  target_output: z.enum(["external_snapshot", "im_lite", "buyer_ready_full_im", "dealroom_ready_package"]),
  status: IMProjectStatusSchema.default("intake"),
  readiness_score: z.number().min(0).max(100).optional(),
  required_expert_patches: z.array(z.string()).default([]),
  source_document_ids: z.array(z.string()).default([]),
  source_refs: z.array(z.any()).default([]),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional()
});
export type IMProject = z.infer<typeof IMProjectSchema>;

// 4. IMSection
export const IMSectionTypeSchema = z.enum([
  "cover_confidentiality", "executive_summary", "investment_thesis_buyer_fit",
  "property_fact_sheet", "land_zoning_legal_constraints", "location_access",
  "micro_market_demand_story", "building_condition_physical_review",
  "rent_roll_lease_quality", "income_noi_yield_analysis",
  "debt_sensitivity_cash_flow", "valuation_logic_comparables",
  "value_add_repositioning_scenario", "risk_factors_dd_checklist",
  "deal_process_next_steps", "dealroom_qna_starter",
  "appendix_evidence_index", "disclaimer_contact"
]);

export const IMSectionStatusSchema = z.enum([
  "not_started", "planned", "ai_draft", "needs_data",
  "needs_expert_patch", "patched", "gate_review", "buyer_ready", "blocked"
]);

export const IMSectionSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  section_type: IMSectionTypeSchema,
  section_order: z.number(),
  title: z.string(),
  status: IMSectionStatusSchema.default("not_started"),
  confidence: z.enum(["confirmed", "inferred", "needs_evidence", "expert_required", "unknown"]).default("unknown"),
  risk_level: z.enum(["low", "medium", "high", "blocked"]).default("medium"),
  requires_expert_patch: z.boolean().default(false),
  required_expert_roles: z.array(z.string()).default([]),
  missing_data: z.array(z.string()).default([]),
  required_evidence: z.array(z.string()).default([]),
  content_json: z.record(z.string(), z.any()).default({}),
  markdown: z.string().optional(),
  source_refs: z.array(z.any()).default([]),
  evidence_refs: z.array(z.any()).default([]),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional()
});
export type IMSection = z.infer<typeof IMSectionSchema>;

// 5. ExpertPatch
export const ExpertRoleSchema = z.enum([
  "cre_consultant", "broker", "legal_expert", "tax_accounting_expert",
  "valuation_expert", "architect_building_expert", "market_research_expert",
  "debt_financing_expert", "reviewer", "admin"
]);

export const PatchTypeSchema = z.enum([
  "fact_correction", "risk_balance", "overclaim_removal",
  "financial_assumption_fix", "legal_boundary_fix", "tax_boundary_fix",
  "valuation_logic_fix", "lease_quality_note", "building_condition_note",
  "market_context_addition", "disclosure_redaction",
  "buyer_message_improvement", "style_edit", "other"
]);

export const EditTagSchema = z.enum([
  "overclaim_removed", "risk_balance_added", "evidence_needed",
  "source_ref_added", "legal_boundary_added", "tax_boundary_added",
  "financial_assumption_added", "disclosure_issue_fixed",
  "tenant_detail_redacted", "unit_rent_redacted", "buyer_fit_clarified",
  "value_add_softened", "wording_professionalized", "section_restructured"
]);

export const TrainingRightsSchema = z.enum([
  "not_allowed", "allowed_anonymized", "allowed_internal_eval_only", "allowed_golden_dataset"
]);

export const ExpertPatchSchema = z.object({
  id: z.string(),
  assignment_id: z.string().optional(),
  project_id: z.string(),
  section_id: z.string().optional(),
  expert_id: z.string(),
  expert_role: ExpertRoleSchema,
  patch_type: PatchTypeSchema,
  before_text: z.string().optional(),
  after_text: z.string(),
  edit_tags: z.array(EditTagSchema).default([]),
  rationale: z.string().optional(),
  visibility_after_review: z.enum(["internal_only", "gate_restricted", "buyer_ready", "blocked"]).default("internal_only"),
  requires_additional_review: z.boolean().default(false),
  training_rights: TrainingRightsSchema.default("not_allowed"),
  status: z.enum(["draft", "submitted", "reviewed", "approved", "rejected"]).default("draft"),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).optional()
});
export type ExpertPatch = z.infer<typeof ExpertPatchSchema>;

// 6. Schema Validation Helper
export function validateSchema<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// 7. Event Name Helper
export const EventNameSchema = z.enum([
  "project_created", "ssot_updated", "section_drafted", "patch_submitted",
  "gate_approved", "gate_rejected", "export_completed"
]);
export function getEventName(name: z.infer<typeof EventNameSchema>) {
  return name;
}

// 8. Disclosure Helper Placeholder
export function isFieldProtected(fieldName: string): boolean {
  const protectedFields = [
    "exact_address", "tenant_name", "unit_rent", 
    "seller_motivation", "negotiation_memo", "internal_broker_note"
  ];
  return protectedFields.includes(fieldName);
}

// 9. Forbidden Claims
export const ForbiddenClaims = [
  "투자 가치가 높습니다",
  "매수 추천",
  "안전한 투자처",
  "우량 매물",
  "적정 가격",
  "저평가",
  "시장가보다 저렴",
  "수익률이 보장",
  "NOI는 확정",
  "Cap Rate는 안정",
  "대출 가능합니다",
  "LTV",
  "세금상 유리",
  "법적 문제 없습니다",
  "용도변경 가능합니다",
  "위반건축물 문제가 없습니다",
  "임대료가 상승합니다",
  "공실은 쉽게 해소"
] as const;

export function detectForbiddenClaims(text: string): string[] {
  const detected: string[] = [];
  for (const claim of ForbiddenClaims) {
    if (text.includes(claim)) {
      detected.push(claim);
    }
  }
  return detected;
}

export function assertNoForbiddenClaims(text: string): void {
  const detected = detectForbiddenClaims(text);
  if (detected.length > 0) {
    throw new Error(`Unsafe statement detected: ${detected.join(", ")}`);
  }
}

export function rewriteUnsafeClaim(text: string): string {
  // Simple deterministic rewrite for tests.
  let rewritten = text;
  rewritten = rewritten.replace(/매수 추천/g, "검토 여지가 있으나 확인이 필요합니다");
  rewritten = rewritten.replace(/적정 가격/g, "가격 수준은 확인이 필요합니다");
  return rewritten;
}

// ─── 10. Handoff Contracts ───────────────────────────────────────────

export const HandoffStatusSchema = z.enum([
  "created", "pending_import", "imported", "expired", "revoked", "failed"
]);
export type HandoffStatus = z.infer<typeof HandoffStatusSchema>;

export const FullIMHandoffPayloadSchema = z.object({
  handoff_id: z.string(),
  handoff_token: z.string(),

  source_app: z.literal("js-building-ssot-mvp"),
  source_app_version: z.string().optional(),
  contracts_version: z.string(),
  payload_version: z.string().default("1.0"),

  source_building_ssot_lite_id: z.string(),
  source_document_ids: z.array(z.string()).default([]),

  source_buyer_intent_id: z.string().optional(),
  source_owner_readiness_id: z.string().optional(),
  source_expert_note_request_id: z.string().optional(),

  requested_output: z.enum([
    "im_lite", "buyer_ready_full_im", "expert_review",
    "expert_full_build", "dealroom_ready_package"
  ]),

  package_intent: z.enum([
    "ai_self_authoring", "ai_expert_review", "expert_full_build",
    "dealroom_ready_package", "unknown"
  ]).default("unknown"),

  created_by: z.string().optional(),
  actor_role: z.enum(["public_user", "owner", "broker", "admin", "system"]),

  source_visibility_level: z.enum([
    "public", "public_blind", "registered_interest", "qualified_summary",
    "gate_restricted", "internal_only", "private_truth"
  ]),

  allowed_import_scope: z.array(z.enum([
    "building_ssot_lite", "source_documents", "buyer_intent",
    "owner_readiness", "expert_note", "evidence_refs"
  ])).default(["building_ssot_lite"]),

  expires_at: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true })
});
export type FullIMHandoffPayload = z.infer<typeof FullIMHandoffPayloadSchema>;

export const HandoffSourceSnapshotSchema = z.object({
  id: z.string(),
  handoff_id: z.string(),

  source_app: z.literal("js-building-ssot-mvp"),
  source_app_version: z.string().optional(),
  contracts_version: z.string(),
  payload_version: z.string(),

  source_building_ssot_lite_id: z.string(),
  source_objects: z.record(z.string(), z.any()).default({}),

  imported_by: z.string().optional(),
  imported_at: z.string().datetime({ offset: true }),

  import_status: z.enum(["pending", "imported", "imported_with_warnings", "failed"]),
  warnings: z.array(z.string()).default([])
});
export type HandoffSourceSnapshot = z.infer<typeof HandoffSourceSnapshotSchema>;

// ─── 11. Cross-App Activity Event ────────────────────────────────────

export const CrossAppActivityEventSchema = z.object({
  id: z.string(),
  source_app: z.enum(["js-building-ssot-mvp", "js-full-im-studio"]),
  actor_id: z.string().optional(),
  actor_role: z.string(),
  /** event_type matches MVP activity_events.event_type column */
  event_type: z.string(),
  entity_type: z.string(),
  entity_id: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  occurred_at: z.string().datetime({ offset: true })
});
export type CrossAppActivityEvent = z.infer<typeof CrossAppActivityEventSchema>;

// ─── 12. Protected Fields List ───────────────────────────────────────

export const PROTECTED_FIELDS = [
  "exact_address", "tenant_name", "unit_rent",
  "seller_motivation", "negotiation_memo", "internal_broker_note",
  "raw_registry_details", "full_lease_contract"
] as const;

export function stripProtectedFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result = { ...obj };
  for (const field of PROTECTED_FIELDS) {
    delete (result as Record<string, unknown>)[field];
  }
  return result;
}

// ─── 13. Handoff Error Codes ─────────────────────────────────────────

export const HANDOFF_ERROR_CODES = {
  HANDOFF_INVALID: "HANDOFF_INVALID",
  HANDOFF_EXPIRED: "HANDOFF_EXPIRED",
  HANDOFF_REVOKED: "HANDOFF_REVOKED",
  HANDOFF_ALREADY_IMPORTED: "HANDOFF_ALREADY_IMPORTED",
  HANDOFF_PERMISSION_DENIED: "HANDOFF_PERMISSION_DENIED",
  HANDOFF_CONTRACT_MISMATCH: "HANDOFF_CONTRACT_MISMATCH",
  HANDOFF_SOURCE_FETCH_FAILED: "HANDOFF_SOURCE_FETCH_FAILED",
  HANDOFF_DISCLOSURE_REVIEW_REQUIRED: "HANDOFF_DISCLOSURE_REVIEW_REQUIRED",
} as const;

