import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as gateReviewRunPOST } from "@/app/api/im-projects/[id]/gate-review/run/route";
import { POST as exportPOST } from "@/app/api/im-projects/[id]/export/route";

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
  },
  from: vi.fn((table) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        if (table === "im_projects") {
          return Promise.resolve({ data: { id: "proj_001", status: "buyer_ready", readiness_score: 100, created_by: "test-user-id" } });
        }
        if (table === "gate_reviews") {
          return Promise.resolve({ data: { project_id: "proj_001", overall_status: "passed", has_p0_violation: false, buyer_ready_eligible: true } });
        }
        if (table === "building_ssot_full") {
          return Promise.resolve({ data: { id: "bssot_001" } });
        }
        if (table === "export_jobs") {
          return Promise.resolve({ data: { id: "job_001" } });
        }
        return Promise.resolve({ data: {} });
      }),
      then: vi.fn().mockImplementation((res) => {
        if (table === "im_sections") {
          res({ data: [{ id: "sec_001", section_type: "executive_summary", status: "patched" }] });
        } else if (table === "expert_patches") {
          res({ data: [{ section_id: "sec_001", status: "approved", visibility_after_review: "buyer_ready" }] });
        } else {
          res({ data: [] });
        }
      })
    };
    return chain;
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => mockSupabase,
}));

describe("E2E-4 Walkthrough: Gate Review & Export", () => {
  it("Phase 1: Run Gate Review", async () => {
    const req = new NextRequest("http://localhost/api/im-projects/proj_001/gate-review/run", { method: "POST" });
    const res = await gateReviewRunPOST(req, { params: Promise.resolve({ id: "proj_001" }) });
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.data.overall_status).toBeDefined();
    expect(json.data.buyer_ready_eligible).toBeDefined();
  });

  it("Phase 2: Export PDF", async () => {
    const req = new NextRequest("http://localhost/api/im-projects/proj_001/export", {
      method: "POST",
      body: JSON.stringify({
        export_type: "pdf",
        export_mode: "buyer_ready",
      })
    });
    const res = await exportPOST(req, { params: Promise.resolve({ id: "proj_001" }) });
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.data.job_id).toBeDefined();
    expect(json.data.output.format).toBe("pdf_placeholder");
  });
});
