import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as requestExpertPatchPOST } from "@/app/api/im-projects/[id]/request-expert-patch/route";
import { POST as submitPatchPOST } from "@/app/api/expert-patches/[assignmentId]/submit/route";

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "expert-user-id" } } }),
  },
  from: vi.fn((table) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        if (table === "expert_assignments") {
          return Promise.resolve({
            data: { id: "assign_001", project_id: "proj_001", section_id: "sec_001", expert_id: "expert-user-id", status: "assigned" }
          });
        }
        if (table === "expert_patches") {
          return Promise.resolve({ data: { id: "patch_001", status: "submitted" } });
        }
        return Promise.resolve({ data: {} });
      }),
    };
    return chain;
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

describe("E2E-3 Walkthrough: Expert Assignment & Patch", () => {
  it("Phase 1: Request Expert Patch", async () => {
    const req = new NextRequest("http://localhost/api/im-projects/proj_001/request-expert-patch", {
      method: "POST",
      body: JSON.stringify({
        section_id: "sec_001",
        expert_id: "expert-user-id",
        expert_role: "tax_accounting_expert",
        assignment_type: "review_and_patch",
      })
    });
    const res = await requestExpertPatchPOST(req, { params: { id: "proj_001" } });
    const json = await res.json();
    
    expect(res.status).toBe(201);
    expect(json.assignment_id).toBeDefined();
    expect(json.status).toBe("assigned");
  });

  it("Phase 2: Submit Expert Patch", async () => {
    const req = new NextRequest("http://localhost/api/expert-patches/assign_001/submit", {
      method: "POST",
      body: JSON.stringify({
        project_id: "proj_001",
        section_id: "sec_001",
        expert_role: "tax_accounting_expert",
        patch_type: "tax_boundary_fix",
        after_text: "Updated text",
        edit_tags: ["tax_boundary_added"],
        visibility_after_review: "internal_only",
        training_rights: "not_allowed",
        requires_additional_review: false,
      })
    });
    const res = await submitPatchPOST(req, { params: Promise.resolve({ assignmentId: "assign_001" }) });
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.data.status).toBe("submitted");
    expect(json.data.patch_id).toBeDefined();
  });
});
