// src/app/api/mobile-im/[id]/enrich/route.ts

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enrichBuildingData } from "@/lib/external/external-data-orchestrator";
import { computeMobileIMReadiness } from "@/domain/mobile-im/mobile-im-readiness";
import { generateMobileIM } from "@/domain/mobile-im/mobile-im-writer";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params.id;
  
  try {
    const supabase = createServiceClient();
    
    // 1. Fetch project from Supabase
    const { data: project, error: fetchErr } = await supabase
      .from("mobile_im_projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const bssotLite = (project.building_ssot_lite || {}) as Record<string, any>;
    const rawAddress = bssotLite.address || "";
    const bssotId = project.source_building_ssot_lite_id || bssotLite.id || id;

    if (!rawAddress) {
      return NextResponse.json({ error: "No address found in building SSOT." }, { status: 400 });
    }

    // 2. Trigger public API data enrichment and database caching
    const enrichmentResult = await enrichBuildingData(rawAddress, bssotId);
    if (!enrichmentResult) {
      return NextResponse.json({ error: "Failed to resolve address or fetch enrichment." }, { status: 500 });
    }

    const supplementalInput = project.supplemental_input || {};

    // 3. Recalculate readiness score with enriched external data
    const readiness = computeMobileIMReadiness(bssotLite, supplementalInput, enrichmentResult);

    // 4. Regenerate Mobile IM sections with the fresh cache
    const writerOutput = await generateMobileIM({
      building_ssot_lite: bssotLite,
      supplemental: supplementalInput,
      readiness,
      external_data: enrichmentResult,
    });

    // 5. Update project in database with new enrichment metadata, score, and sections
    const { error: updateErr } = await supabase
      .from("mobile_im_projects")
      .update({
        readiness_score: readiness.score,
        full_im_missing_data: readiness.missing,
        sections: writerOutput.sections,
        boundary_note: writerOutput.boundary_note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      console.error("Failed to update project sections in Supabase:", updateErr);
      return NextResponse.json({ error: "Failed to save regenerated sections." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Data enriched and Mobile IM successfully regenerated.",
      readiness_score: readiness.score,
      sections_count: writerOutput.sections.length,
    }, { status: 200 });

  } catch (err: any) {
    console.error("Enrich API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
