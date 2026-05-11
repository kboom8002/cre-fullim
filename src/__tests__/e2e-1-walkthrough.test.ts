import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as importFromHandoffPOST } from "@/app/api/im-projects/import-from-handoff/route";
import { GET as getPreviewHandoffGET } from "@/app/api/im-projects/preview-handoff/[token]/route";
import { POST as readinessCheckPOST } from "@/app/api/im-projects/[id]/readiness-check/route";
import { GET as getProjectGET } from "@/app/api/im-projects/[id]/route";

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
  },
  from: vi.fn((table) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      if (table === "im_projects") {
        return Promise.resolve({ data: { id: "proj_001", status: "intake", building_ssot_full_id: "bssot_001", created_by: "test-user-id" } });
      }
      if (table === "handoff_source_snapshots") {
        return Promise.resolve({ data: { id: "snap_001" } });
      }
      if (table === "building_ssot_full") {
        return Promise.resolve({ data: { id: "bssot_001" } });
      }
      return Promise.resolve({ data: {} });
    }),
  })),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => mockSupabase,
}));

describe("E2E-1 Walkthrough: Handoff -> Import -> Dashboard", () => {
  it("Phase 1: Preview Handoff", async () => {
    const req = new NextRequest("http://localhost/api/im-projects/preview-handoff/hof_demo_pilot_001");
    const res = await getPreviewHandoffGET(req, { params: Promise.resolve({ token: "hof_demo_pilot_001"  }) });
    const json = await res.json();
    
    expect(res.status).toBe(200);
    // Protected fields should be excluded
    expect(json).not.toHaveProperty("exact_address");
    expect(json).not.toHaveProperty("tenant_name");
  });

  it("Phase 2: Import from Handoff", async () => {
    const req = new NextRequest("http://localhost/api/im-projects/import-from-handoff", {
      method: "POST",
      body: JSON.stringify({ handoff_token: "hof_demo_pilot_001" }),
    });
    
    const res = await importFromHandoffPOST(req);
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.im_project_id).toBeDefined();
    // In our mock, it returns proj_001 but let's check structure
  });

  it("Phase 3: Readiness Check", async () => {
    const req = new NextRequest("http://localhost/api/im-projects/proj_001/readiness-check", {
      method: "POST"
    });
    const res = await readinessCheckPOST(req, { params: Promise.resolve({ id: "proj_001" }) });
    const json = await res.json();
    
    // Check if readiness score is returned
    // Wait, the API route might need real data to run checkExportEligibility.
    // We will see what happens when we run it.
  });

  it("Phase 4: Dashboard Get Project", async () => {
    const req = new NextRequest("http://localhost/api/im-projects/proj_001");
    const res = await getProjectGET(req, { params: Promise.resolve({ id: "proj_001"  }) });
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.id).toBe("proj_001");
    expect(json.status).toBe("intake");
  });
});
