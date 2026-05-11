import { NextRequest, NextResponse } from "next/server";
import { resolveHandoffPayload, createSafePreview } from "@/domain/handoff/handoff-service";
import { HANDOFF_ERROR_CODES } from "@js-ssot/contracts";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const resolved = await resolveHandoffPayload(token);

    if (!resolved.success) {
      return NextResponse.json(
        { error: { code: resolved.code, message: resolved.message } },
        { status: 400 }
      );
    }

    const payload = resolved.payload;
    const sourceData = payload.building_ssot_lite || {};
    const safePreview = createSafePreview(payload, sourceData);

    return NextResponse.json(safePreview, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: {
          code: HANDOFF_ERROR_CODES.HANDOFF_INVALID,
          message: error instanceof Error ? error.message : "알 수 없는 에러가 발생했습니다.",
        },
      },
      { status: 500 }
    );
  }
}
