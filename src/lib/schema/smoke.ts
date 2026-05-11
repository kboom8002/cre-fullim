import { z } from "zod";

export const SmokeSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "buyer-ready", "archived"]),
  title: z.string().min(1),
  version: z.number().int().positive(),
});

export type SmokeType = z.infer<typeof SmokeSchema>;
