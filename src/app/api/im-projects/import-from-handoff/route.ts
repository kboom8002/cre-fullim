/**
 * POST /api/im-projects/import-from-handoff
 *
 * Full IM Studio side: resolves handoff token → calls MVP's GET /api/full-im-handoffs/:token
 * → creates snapshot, building_ssot_full, im_project in shared Supabase.
 *
 * Request body: { handoff_token: string }
 * Response:     { im_project_id, building_ssot_full_id, status, next_url }
 *              OR { error, code, message }
 *
 * Source: docs/06-handoff-api-contract.md §5.1
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateHandoffToken,
  importFromHandoff,
} from "@/domain/handoff/handoff-service";
import { HANDOFF_ERROR_CODES } from "@js-ssot/contracts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handoff_token } = body;

    // Token format validation
    const tokenCheck = validateHandoffToken(handoff_token);
    if (!tokenCheck.valid) {
      return NextResponse.json(
        { error: true, code: tokenCheck.code, message: tokenCheck.message },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    const actorId = userAuth?.user?.id ?? null;

    const result = await importFromHandoff(handoff_token, actorId);

    if (!result.success) {
      const statusCode =
        result.code === HANDOFF_ERROR_CODES.HANDOFF_EXPIRED ? 410 :
        result.code === HANDOFF_ERROR_CODES.HANDOFF_INVALID ? 404 :
        result.code === HANDOFF_ERROR_CODES.HANDOFF_ALREADY_IMPORTED ? 409 :
        result.code === HANDOFF_ERROR_CODES.HANDOFF_REVOKED ? 410 :
        400;

      return NextResponse.json(
        { error: true, code: result.code, message: result.message },
        { status: statusCode },
      );
    }

    return NextResponse.json({
      im_project_id: result.im_project_id,
      building_ssot_full_id: result.building_ssot_full_id,
      snapshot_id: result.snapshot_id,
      status: "readiness_pending",
      next_url: `/im-projects/${result.im_project_id}`,
    });
  } catch (err) {
    console.error("[POST /api/im-projects/import-from-handoff]", err);
    return NextResponse.json(
      { error: true, code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
