import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as readinessCheckPOST } from "@/app/api/im-projects/[id]/readiness-check/route";
import { POST as generateOutlinePOST } from "@/app/api/im-projects/[id]/generate-outline/route";
import { POST as generateDraftPOST } from "@/app/api/im-sections/[id]/generate-draft/route";

// Mock Supabase
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
          return Promise.resolve({ data: { id: "proj_001", status: "intake", building_ssot_full_id: "bssot_001", created_by: "test-user-id" } });
        }
        if (table === "building_ssot_full") {
          return Promise.resolve({ data: { id: "bssot_001", evidence_source: {} } });
        }
        if (table === "im_sections") {
          return Promise.resolve({ data: { id: "sec_001", project_id: "proj_001", section_type: "executive_summary", status: "planned" } });
        }
        return Promise.resolve({ data: {} });
      }),
      then: vi.fn().mockImplementation((res) => {
         if (table === "im_sections") {
           // For the existing sections query
           res({ data: [] });
         } else {
           res({ data: {} });
         }
      })
    };
    return chain;
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

describe("E2E-2 Walkthrough: Readiness -> Outline -> AI Draft", () => {
  it("Phase 1: Readiness Check", async () => {
    const req = new NextRequest("http://localhost/api/im-projects/proj_001/readiness-check", { method: "POST" });
    const res = await readinessCheckPOST(req, { params: Promise.resolve({ id: "proj_001" }) });
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.data.readiness_score).toBeDefined();
  });

  it("Phase 2: Generate Outline", async () => {
    const req = new NextRequest("http://localhost/api/im-projects/proj_001/generate-outline", { method: "POST" });
    const res = await generateOutlinePOST(req, { params: Promise.resolve({ id: "proj_001" }) });
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.data.sections_created).toBe(18); // Default number of sections
  });

  it("Phase 3: Generate AI Draft", async () => {
    const req = new NextRequest("http://localhost/api/im-sections/sec_001/generate-draft", { method: "POST" });
    const res = await generateDraftPOST(req, { params: Promise.resolve({ id: "sec_001" }) });
    const json = await res.json();
    
    // AI provider should return safe text
    expect(res.status).toBe(200);
    expect(json.data.status).toBe("ai_draft");
    expect(json.data.markdown).toBeDefined();
  });
});
