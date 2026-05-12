/**
 * Handoff Import Service — Supabase Implementation
 *
 * Full IM Studio side of the handoff API contract.
 * Calls MVP's GET /api/full-im-handoffs/:token to resolve payload,
 * then creates snapshot, building_ssot_full, and im_project in shared Supabase.
 *
 * Follows:
 *   - docs/06-handoff-api-contract.md
 *   - docs/07-import-from-bssot-lite.md
 *   - docs/09-cross-app-events.md
 *
 * Rules:
 *   - Never mutate MVP source data.
 *   - Protected fields must not leak into preview.
 *   - Every important mutation emits an activity_event.
 *   - activity_events.event_type matches MVP DB schema.
 */

import {
  FullIMHandoffPayloadSchema,
  HANDOFF_ERROR_CODES,
  PROTECTED_FIELDS,
  type FullIMHandoffPayload,
} from "@js-ssot/contracts";
import { createServiceClient } from "@/lib/supabase/service";

// ─── Types ───────────────────────────────────────────────────────────

type TokenResult =
  | { valid: true }
  | { valid: false; code: string; message: string };

type ResolveResult =
  | { success: true; payload: FullIMHandoffPayload & { status: string; building_ssot_lite?: Record<string, unknown> } }
  | { success: false; code: string; message: string };

export type ImportResult =
  | {
      success: true;
      im_project_id: string;
      building_ssot_full_id: string;
      snapshot_id: string;
    }
  | { success: false; code: string; message: string };

// ─── Token Validation ────────────────────────────────────────────────

export function validateHandoffToken(token: unknown): TokenResult {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      valid: false,
      code: HANDOFF_ERROR_CODES.HANDOFF_INVALID,
      message: "유효하지 않은 요청입니다.",
    };
  }
  return { valid: true };
}

// ─── Payload Resolution (calls MVP API) ─────────────────────────────

export async function resolveHandoffPayload(token: string): Promise<ResolveResult> {
  const tokenCheck = validateHandoffToken(token);
  if (!tokenCheck.valid) {
    return { success: false, code: tokenCheck.code, message: tokenCheck.message };
  }

  // Demo bypass for test tokens during development
  if (token.startsWith("hof_demo_")) {
    const demoPayload = buildDemoPayload(token);
    return { success: true, payload: demoPayload };
  }

  const mvpBaseUrl = process.env.MVP_BASE_URL ?? "https://cre-dealcard.vercel.app";
  let resp: Response;
  try {
    resp = await fetch(`${mvpBaseUrl}/api/full-im-handoffs/${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-service-api-key": process.env.INTER_SERVICE_API_KEY || "mock-inter-service-key",
      },
    });
  } catch {
    return {
      success: false,
      code: HANDOFF_ERROR_CODES.HANDOFF_SOURCE_FETCH_FAILED,
      message: "MVP 서버에 연결할 수 없습니다.",
    };
  }

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    const code = body?.error?.code ?? HANDOFF_ERROR_CODES.HANDOFF_INVALID;
    const message = body?.error?.message ?? "유효하지 않은 요청입니다.";
    return { success: false, code, message };
  }

  const body = await resp.json();
  const rawPayload = body?.data;

  if (!rawPayload) {
    return {
      success: false,
      code: HANDOFF_ERROR_CODES.HANDOFF_INVALID,
      message: "유효하지 않은 응답입니다.",
    };
  }

  // Expiry check (belt-and-suspenders, MVP already checks)
  if (rawPayload.expires_at && new Date(rawPayload.expires_at) < new Date()) {
    return {
      success: false,
      code: HANDOFF_ERROR_CODES.HANDOFF_EXPIRED,
      message: "이 요청은 만료되었습니다.",
    };
  }

  // Status checks
  if (rawPayload.status === "imported") {
    return { success: false, code: HANDOFF_ERROR_CODES.HANDOFF_ALREADY_IMPORTED, message: "이미 처리된 요청입니다." };
  }
  if (rawPayload.status === "revoked") {
    return { success: false, code: HANDOFF_ERROR_CODES.HANDOFF_REVOKED, message: "취소된 요청입니다." };
  }

  // Validate schema
  const parsed = FullIMHandoffPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      success: false,
      code: HANDOFF_ERROR_CODES.HANDOFF_CONTRACT_MISMATCH,
      message: "데이터 형식이 맞지 않습니다.",
    };
  }

  return {
    success: true,
    payload: {
      ...parsed.data,
      status: rawPayload.status ?? "pending_import",
      building_ssot_lite: rawPayload.building_ssot_lite ?? undefined,
    },
  };
}

// ─── Safe Preview ────────────────────────────────────────────────────

export function createSafePreview(
  payload: FullIMHandoffPayload,
  sourceData: Record<string, unknown>,
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(sourceData)) {
    if (!PROTECTED_FIELDS.includes(key as (typeof PROTECTED_FIELDS)[number])) {
      safe[key] = value;
    }
  }
  safe.requested_output = payload.requested_output;
  safe.package_intent = payload.package_intent;
  safe.expires_at = payload.expires_at;
  return safe;
}

// ─── Full Import Flow (writes to shared Supabase) ────────────────────

export async function importFromHandoff(
  token: string,
  actorId: string,
): Promise<ImportResult> {
  // 1. Resolve payload from MVP
  const resolved = await resolveHandoffPayload(token);
  if (!resolved.success) {
    await emitEvent({
      actorId,
      actorRole: "system",
      eventType: "handoff_import_failed",
      entityType: "full_im_handoff",
      metadata: { code: resolved.code, token },
    });
    return resolved;
  }

  // Demo intercept: if it's the exact demo token, return the seeded project IDs.
  if (token === "hof_demo_2026_sungsu_001") {
    // We assume demo-seed.ts has run and these UUIDs exist.
    return {
      success: true,
      im_project_id: "00000000-0000-0000-0000-000000000010",
      building_ssot_full_id: "00000000-0000-0000-0000-000000000020",
      snapshot_id: "00000000-0000-0000-0000-000000000030",
    };
  }

  const payload = resolved.payload;
  const bssotLiteData = payload.building_ssot_lite ?? {};

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // 2. Create source snapshot (immutable — never mutates MVP)
  const snapshotInsert = {
    handoff_id: payload.handoff_id,
    source_app: "js-building-ssot-mvp",
    contracts_version: payload.contracts_version,
    payload_version: payload.payload_version,
    source_building_ssot_lite_id: payload.source_building_ssot_lite_id,
    source_objects: {
      building_ssot_lite: bssotLiteData,  // frozen snapshot of source data
      source_document_ids: payload.source_document_ids,
      source_buyer_intent_id: payload.source_buyer_intent_id,
      source_owner_readiness_id: payload.source_owner_readiness_id,
    },
    imported_by: actorId || null,
    imported_at: now,
    import_status: "imported",
    warnings: [],
  };

  const { data: snapshot, error: snapErr } = await supabase
    .from("handoff_source_snapshots")
    .insert(snapshotInsert)
    .select("id")
    .single();

  if (snapErr || !snapshot) {
    return {
      success: false,
      code: HANDOFF_ERROR_CODES.HANDOFF_SOURCE_FETCH_FAILED,
      message: `스냅샷 저장에 실패했습니다: ${snapErr?.message}`,
    };
  }

  // 3. Create Building SSoT Full draft
  // Gap 4 fix: map building_ssot_lite fields → building_ssot_full layers
  const assetIdentity = buildAssetIdentityFromLite(bssotLiteData);
  const physicalFact = buildPhysicalFactFromLite(bssotLiteData);

  const { data: bssotFull, error: bssotErr } = await supabase
    .from("building_ssot_full")
    .insert({
      source_building_ssot_lite_id: payload.source_building_ssot_lite_id,
      created_by: actorId || null,
      asset_identity: assetIdentity,
      physical_fact: physicalFact,
      legal_registry: {},
      lease_income: {},
      market_location: {},
      value_up_hypothesis: {},
      risk_unknown: {},
      buyer_fit: {},
      disclosure_gate: {
        protected_fields: [...PROTECTED_FIELDS],
        hidden_fields: bssotLiteData.hidden_fields ?? [],
        source_disclosure: bssotLiteData.disclosure ?? {},
        allowed_visibility: [],
        gate_notes: [],
      },
      evidence_source: { source_refs: [], evidence_refs: [] },
      b2c_consumer_demand: {},
      space_environmental: {},
      tenant_operator_management: {},
      ai_answer_document_contract: {},
      readiness_status: "lite_imported",
    })
    .select("id")
    .single();

  if (bssotErr || !bssotFull) {
    return {
      success: false,
      code: "INTERNAL_ERROR",
      message: `BSSoT Full 생성에 실패했습니다: ${bssotErr?.message}`,
    };
  }

  // 4. Create IM Project
  const projectType = mapPackageIntent(payload.package_intent);
  const targetOutput = mapRequestedOutput(payload.requested_output);

  const { data: imProject, error: projErr } = await supabase
    .from("im_projects")
    .insert({
      source_app: "js-building-ssot-mvp",
      source_building_ssot_lite_id: payload.source_building_ssot_lite_id,
      building_ssot_full_id: bssotFull.id,
      handoff_id: payload.handoff_id,
      created_by: actorId || null,
      project_owner_id: actorId || null,
      project_type: projectType,
      target_output: targetOutput,
      status: "intake",
      source_document_ids: payload.source_document_ids ?? [],
    })
    .select("id")
    .single();

  if (projErr || !imProject) {
    return {
      success: false,
      code: "INTERNAL_ERROR",
      message: `IM 프로젝트 생성에 실패했습니다: ${projErr?.message}`,
    };
  }

  // Add the actor as project owner if it's a real user
  if (actorId && actorId !== "00000000-0000-0000-0000-000000000000") {
    await supabase.from("im_project_members").insert({
      project_id: imProject.id,
      user_id: actorId,
      role: "owner"
    });
  }

  // 5. Mark handoff as imported (notify MVP via its own DB)
  await supabase
    .from("full_im_handoffs")
    .update({ status: "imported", imported_at: now })
    .eq("id", payload.handoff_id);

  // 6. Emit activity events with source_app tag (Gap 2 fix)
  await emitEvent({
    actorId,
    actorRole: payload.actor_role,
    eventType: "handoff_imported",
    entityType: "full_im_handoff",
    entityId: payload.handoff_id,
    metadata: {
      source_building_ssot_lite_id: payload.source_building_ssot_lite_id,
      requested_output: payload.requested_output,
      snapshot_id: snapshot.id,
    },
  });

  await emitEvent({
    actorId,
    actorRole: payload.actor_role,
    eventType: "bssot_full_created",
    entityType: "building_ssot_full",
    entityId: bssotFull.id,
    metadata: {
      source_building_ssot_lite_id: payload.source_building_ssot_lite_id,
      readiness_status: "lite_imported",
    },
  });

  await emitEvent({
    actorId,
    actorRole: payload.actor_role,
    eventType: "im_project_created",
    entityType: "im_project",
    entityId: imProject.id,
    metadata: { project_type: projectType, target_output: targetOutput },
  });

  return {
    success: true,
    im_project_id: imProject.id,
    building_ssot_full_id: bssotFull.id,
    snapshot_id: snapshot.id,
  };
}

// ─── Event Emitter ───────────────────────────────────────────────────

async function emitEvent({
  actorId,
  actorRole,
  eventType,
  entityType,
  entityId,
  metadata,
}: {
  actorId: string;
  actorRole: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = createServiceClient();
    await supabase.from("activity_events").insert({
      actor_id: actorId || null,
      actor_role: actorRole,
      event_type: eventType,           // matches MVP column name
      entity_type: entityType,
      entity_id: entityId ?? null,
      source_app: "js-full-im-studio",  // Gap 2: source_app discriminator
      metadata: metadata ?? {},
    });
  } catch {
    // Events should not crash the import flow
    console.warn("[emitEvent] Failed to emit event:", eventType);
  }
}

// ─── Gap 4: building_ssot_lite → building_ssot_full field mapping ────

function buildAssetIdentityFromLite(lite: Record<string, unknown>): Record<string, unknown> {
  return {
    area_signal: lite.area_signal ?? null,
    asset_type: lite.asset_type ?? null,
    price_band: lite.price_band ?? null,
    fit_summary: lite.fit_summary ?? null,
    caution_summary: lite.caution_summary ?? null,
    status: lite.status ?? null,
    source: "building_ssot_lite",
  };
}

function buildPhysicalFactFromLite(lite: Record<string, unknown>): Record<string, unknown> {
  return {
    size_signal: lite.size_signal ?? null,
    current_use_signal: lite.current_use_signal ?? null,
    vacancy_signal: lite.vacancy_signal ?? null,
    source: "building_ssot_lite",
  };
}

// ─── Mappers ─────────────────────────────────────────────────────────

function mapRequestedOutput(
  requested: string,
): "external_snapshot" | "im_lite" | "buyer_ready_full_im" | "dealroom_ready_package" {
  switch (requested) {
    case "im_lite": return "im_lite";
    case "buyer_ready_full_im": return "buyer_ready_full_im";
    case "dealroom_ready_package": return "dealroom_ready_package";
    default: return "buyer_ready_full_im";
  }
}

function mapPackageIntent(
  intent: string,
): "ai_self_authoring" | "ai_expert_review" | "expert_full_build" | "dealroom_ready_package" {
  switch (intent) {
    case "ai_self_authoring": return "ai_self_authoring";
    case "ai_expert_review": return "ai_expert_review";
    case "expert_full_build": return "expert_full_build";
    case "dealroom_ready_package": return "dealroom_ready_package";
    default: return "ai_self_authoring";
  }
}

// ─── Demo payload for development/testing ────────────────────────────

function buildDemoPayload(token: string): FullIMHandoffPayload & {
  status: string;
  building_ssot_lite: Record<string, unknown>;
} {
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    handoff_id: `demo-handoff-${token}`,
    handoff_token: token,
    source_app: "js-building-ssot-mvp",
    source_app_version: "0.1.0",
    contracts_version: "0.2.0",
    payload_version: "1.0",
    source_building_ssot_lite_id: "demo-building-001",
    source_document_ids: ["demo-doc-001"],
    requested_output: "buyer_ready_full_im",
    package_intent: "ai_expert_review",
    actor_role: "broker",
    source_visibility_level: "internal_only",
    allowed_import_scope: ["building_ssot_lite", "source_documents"],
    expires_at: expires.toISOString(),
    created_at: now.toISOString(),
    status: "pending_import",
    building_ssot_lite: {
      id: "demo-building-001",
      area_signal: "성수권역",
      asset_type: "근생형 꼬마빌딩",
      price_band: "50~80억",
      size_signal: "연면적 약 500㎡",
      current_use_signal: "근린생활시설",
      vacancy_signal: "1층 공실",
      fit_summary: "수익형 투자 적합",
      caution_summary: "1층 공실 리스크",
      hidden_fields: ["exact_address", "tenant_name", "unit_rent"],
      status: "public_signal_ready",
      disclosure: { guard_checked: true },
    },
  };
}
