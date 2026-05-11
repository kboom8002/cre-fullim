import { describe, it, expect } from "vitest";
import { SmokeSchema } from "./smoke";

describe("SmokeSchema validation", () => {
  it("validates valid data", () => {
    const validData = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      status: "draft",
      title: "Test Project",
      version: 1,
    };
    const result = SmokeSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails on invalid data", () => {
    const invalidData = {
      id: "not-a-uuid",
      status: "unknown",
      title: "",
      version: -1,
    };
    const result = SmokeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
