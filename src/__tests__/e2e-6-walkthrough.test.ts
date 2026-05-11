import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as adminAnalyticsGET } from "@/app/api/admin/analytics/route";

// Helper to create mocked NextRequest
function createReq() {
  return new NextRequest("http://localhost/api/admin/analytics");
}

describe("E2E-6 Walkthrough: RBAC & Dashboard Visibility", () => {
  it("Phase 1: Broker Access Denied", async () => {
    // Mock broker user
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: () => ({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "broker-1", app_metadata: { role: "broker" } } } }),
        },
        from: vi.fn(),
      }),
    }));
    
    // Dynamically import the route so it uses the mocked createClient
    const { GET } = await import("@/app/api/admin/analytics/route");
    const res = await GET(createReq());
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("FORBIDDEN");
    
    vi.resetModules();
  });

  it("Phase 2: Admin Access Granted", async () => {
    // Mock admin user
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: () => ({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1", app_metadata: { role: "admin" } } } }),
        },
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        })),
      }),
    }));
    
    const { GET } = await import("@/app/api/admin/analytics/route");
    const res = await GET(createReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.totals).toBeDefined();
    
    vi.resetModules();
  });
});
