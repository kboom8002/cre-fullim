/**
 * Unit Tests: Handoff Import Service
 *
 * Tests for:
 *   1. Token validation (pure)
 *   2. Safe preview generation (pure)
 *   3. Protected field stripping
 *   4. Payload schema validation
 *   5. resolveHandoffPayload — via demo token bypass (no real HTTP)
 *   6. importFromHandoff — via demo token bypass (no real Supabase)
 *
 * Architecture note:
 *   - handoff-service now calls Supabase directly.
 *   - Tests use hof_demo_* tokens which bypass real HTTP/DB.
 *   - Full integration tests would need a test Supabase instance.
 */
import { describe, it, expect } from "vitest";
import {
  FullIMHandoffPayloadSchema,
  HANDOFF_ERROR_CODES,
  PROTECTED_FIELDS,
  stripProtectedFields,
  validateSchema,
} from "@js-ssot/contracts";
import {
  validateHandoffToken,
  resolveHandoffPayload,
  createSafePreview,
} from "@/domain/handoff/handoff-service";

// ─── Fixtures ────────────────────────────────────────────────────────

const NOW = new Date().toISOString();
const FUTURE = new Date(Date.now() + 86_400_000).toISOString(); // +1 day
const PAST = new Date(Date.now() - 86_400_000).toISOString();   // -1 day

function makeValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    handoff_id: "hof_001",
    handoff_token: "hof_token_abc123",
    source_app: "js-building-ssot-mvp" as const,
    contracts_version: "0.2.0",
    payload_version: "1.0",
    source_building_ssot_lite_id: "bsl_001",
    source_document_ids: ["doc_001"],
    requested_output: "buyer_ready_full_im" as const,
    package_intent: "ai_expert_review" as const,
    actor_role: "broker" as const,
    source_visibility_level: "internal_only" as const,
    allowed_import_scope: ["building_ssot_lite" as const],
    expires_at: FUTURE,
    created_at: NOW,
    ...overrides,
  };
}

// ─── 1. Token Validation ─────────────────────────────────────────────

describe("validateHandoffToken", () => {
  it("valid token passes", () => {
    expect(validateHandoffToken("hof_abc123").valid).toBe(true);
  });

  it("empty string fails", () => {
    const r = validateHandoffToken("");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.code).toBe(HANDOFF_ERROR_CODES.HANDOFF_INVALID);
  });

  it("null fails", () => {
    const r = validateHandoffToken(null);
    expect(r.valid).toBe(false);
  });

  it("whitespace-only fails", () => {
    const r = validateHandoffToken("   ");
    expect(r.valid).toBe(false);
  });
});

// ─── 2. Schema Validation ────────────────────────────────────────────

describe("FullIMHandoffPayloadSchema", () => {
  it("valid payload parses successfully", () => {
    const result = FullIMHandoffPayloadSchema.safeParse(makeValidPayload());
    expect(result.success).toBe(true);
  });

  it("missing source_app fails", () => {
    const bad = makeValidPayload();
    delete (bad as Record<string, unknown>).source_app;
    const result = FullIMHandoffPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("wrong source_app literal fails", () => {
    const result = FullIMHandoffPayloadSchema.safeParse(
      makeValidPayload({ source_app: "wrong-app" }),
    );
    expect(result.success).toBe(false);
  });

  it("expired payload still parses (expiry logic is in service)", () => {
    const result = FullIMHandoffPayloadSchema.safeParse(
      makeValidPayload({ expires_at: PAST }),
    );
    expect(result.success).toBe(true);
  });

  it("validateSchema helper works", () => {
    const valid = validateSchema(FullIMHandoffPayloadSchema, makeValidPayload());
    expect(valid.success).toBe(true);
  });
});

// ─── 3. Protected Fields ──────────────────────────────────────────────

describe("Protected field handling", () => {
  const sensitiveData = {
    area_signal: "성수권역",
    asset_type: "꼬마빌딩",
    exact_address: "서울시 성동구 XXX로 1",
    tenant_name: "스타벅스",
    unit_rent: 500,
    seller_motivation: "급매",
    negotiation_memo: "협상가 50억",
    internal_broker_note: "브로커 내부 메모",
    raw_registry_details: "등기부등본 원본",
    full_lease_contract: "임대차 계약서 전문",
  };

  it("PROTECTED_FIELDS contains all 8 protected keys", () => {
    expect(PROTECTED_FIELDS).toContain("exact_address");
    expect(PROTECTED_FIELDS).toContain("tenant_name");
    expect(PROTECTED_FIELDS).toContain("unit_rent");
    expect(PROTECTED_FIELDS).toContain("seller_motivation");
    expect(PROTECTED_FIELDS).toContain("negotiation_memo");
    expect(PROTECTED_FIELDS).toContain("internal_broker_note");
    expect(PROTECTED_FIELDS).toContain("raw_registry_details");
    expect(PROTECTED_FIELDS).toContain("full_lease_contract");
  });

  it("stripProtectedFields removes all 8 protected fields", () => {
    const stripped = stripProtectedFields(sensitiveData);
    for (const field of PROTECTED_FIELDS) {
      expect(stripped).not.toHaveProperty(field);
    }
  });

  it("stripProtectedFields keeps non-protected fields", () => {
    const stripped = stripProtectedFields(sensitiveData);
    expect(stripped.area_signal).toBe("성수권역");
    expect(stripped.asset_type).toBe("꼬마빌딩");
  });
});

// ─── 4. Safe Preview ─────────────────────────────────────────────────

describe("createSafePreview", () => {
  const payload = makeValidPayload() as ReturnType<typeof makeValidPayload>;
  const sourceData = {
    area_signal: "마포권역",
    asset_type: "꼬마빌딩",
    price_band: "30~50억",
    exact_address: "서울시 마포구 XXX동 1번지",
    tenant_name: "테넌트A",
    unit_rent: 300,
    seller_motivation: "이사",
    negotiation_memo: "10% 할인 가능",
    internal_broker_note: "급하지 않음",
    raw_registry_details: "등기 원본",
    full_lease_contract: "임대차 전문",
  };

  const preview = createSafePreview(payload, sourceData);

  it("does not contain exact_address", () => expect(preview).not.toHaveProperty("exact_address"));
  it("does not contain tenant_name", () => expect(preview).not.toHaveProperty("tenant_name"));
  it("does not contain unit_rent", () => expect(preview).not.toHaveProperty("unit_rent"));
  it("does not contain seller_motivation", () => expect(preview).not.toHaveProperty("seller_motivation"));
  it("does not contain negotiation_memo", () => expect(preview).not.toHaveProperty("negotiation_memo"));
  it("does not contain internal_broker_note", () => expect(preview).not.toHaveProperty("internal_broker_note"));

  it("includes area_signal", () => expect(preview.area_signal).toBe("마포권역"));
  it("includes requested_output from payload", () => {
    expect(preview.requested_output).toBe("buyer_ready_full_im");
  });
});

// ─── 5. resolveHandoffPayload (demo bypass) ──────────────────────────

describe("resolveHandoffPayload (demo tokens)", () => {
  it("hof_demo_xxx token resolves successfully without HTTP", async () => {
    const result = await resolveHandoffPayload("hof_demo_test_token");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.payload.source_app).toBe("js-building-ssot-mvp");
      expect(result.payload.requested_output).toBe("buyer_ready_full_im");
      expect(result.payload.building_ssot_lite).toBeDefined();
    }
  });

  it("empty token fails immediately", async () => {
    const result = await resolveHandoffPayload("");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe(HANDOFF_ERROR_CODES.HANDOFF_INVALID);
  });

  it("demo payload has building_ssot_lite with safe fields", async () => {
    const result = await resolveHandoffPayload("hof_demo_test_token");
    expect(result.success).toBe(true);
    if (result.success && result.payload.building_ssot_lite) {
      const lite = result.payload.building_ssot_lite;
      expect(lite.area_signal).toBeDefined();
      expect(lite.asset_type).toBeDefined();
      // Protected fields should be in hidden_fields list, not as values
      expect(lite).not.toHaveProperty("tenant_name");
      expect(lite).not.toHaveProperty("unit_rent");
    }
  });
});

// ─── 6. CrossAppActivityEvent schema ─────────────────────────────────

describe("CrossAppActivityEvent schema", () => {
  it("uses event_type field (not event_name)", async () => {
    const { CrossAppActivityEventSchema } = await import("@js-ssot/contracts");
    const shape = CrossAppActivityEventSchema.shape;
    expect("event_type" in shape).toBe(true);
    expect("event_name" in shape).toBe(false);
  });
});
