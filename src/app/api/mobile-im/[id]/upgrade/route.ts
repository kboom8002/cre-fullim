import { NextRequest, NextResponse } from "next/server";
import { importFromHandoff } from "@/domain/handoff/handoff-service";
import { HANDOFF_ERROR_CODES } from "@js-ssot/contracts";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { handoff_token } = body as { handoff_token?: string };

    if (!handoff_token) {
      return NextResponse.json({ error: true, message: "handoff_token is required for upgrade" }, { status: 400 });
    }

    // Call Full IM import logic
    // We use a mock actorId for now since this is public/broker side
    const actorId = "00000000-0000-0000-0000-000000000000";
    const result = await importFromHandoff(handoff_token, actorId);

    if (!result.success) {
      const statusCode = result.code === HANDOFF_ERROR_CODES.HANDOFF_ALREADY_IMPORTED ? 409 : 400;
      return NextResponse.json({ error: true, code: result.code, message: result.message }, { status: statusCode });
    }

    return NextResponse.json({
      im_project_id: result.im_project_id,
      readiness_score: 52, // Mock score
      missing_data: ["등기부등본", "건축물대장"], // Mock data
      next_url: `/im-projects/${result.im_project_id}`
    });
  } catch (err) {
    console.error("[POST /api/mobile-im/upgrade]", err);
    return NextResponse.json({ error: true, message: "Server Error" }, { status: 500 });
  }
}
