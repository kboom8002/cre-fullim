import { NextRequest, NextResponse } from "next/server";
import { type MobileIMProject } from "@/domain/mobile-im/mobile-im-types";

// In real app, query from DB
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  // Mock logic - assume successful
  return NextResponse.json({
    id,
    status: "published",
    slug: "js-" + id.substring(0, 4)
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  return NextResponse.json({
    id,
    status: body.status || "published"
  });
}
