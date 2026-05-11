/**
 * FullIMWriter Output Schema (Zod)
 *
 * Implements docs/15-ai-agent-contracts.md §7 FullIMWriterOutputSchema.
 *
 * Rules:
 *   - boundary_note is REQUIRED (docs/18 §8)
 *   - confidence must be one of confirmed/inferred/needs_evidence/expert_required/unknown
 *   - risk_level must be low/medium/high/blocked
 *   - AI draft status is always ai_draft — never buyer_ready (docs/15 §2 rule 9)
 */
import { z } from "zod";

export const FullIMWriterOutputSchema = z.object({
  section_type: z.string(),
  title: z.string(),
  markdown: z.string(),
  content_json: z.record(z.string(), z.unknown()).default({}),
  confidence: z.enum(["confirmed", "inferred", "needs_evidence", "expert_required", "unknown"]),
  risk_level: z.enum(["low", "medium", "high", "blocked"]),
  source_refs: z.array(z.record(z.string(), z.unknown())).default([]),
  evidence_refs: z.array(z.record(z.string(), z.unknown())).default([]),
  missing_data: z.array(z.string()).default([]),
  requires_expert_patch: z.boolean(),
  /** Required for all public/buyer-facing drafts — docs/18 §8 */
  boundary_note: z.string().min(1),
  /** Always "ai_draft" — AI cannot approve buyer_ready (docs/15 §2 rule 9) */
  status: z.enum(["ai_draft"]).default("ai_draft"),
});

export type FullIMWriterOutput = z.infer<typeof FullIMWriterOutputSchema>;
