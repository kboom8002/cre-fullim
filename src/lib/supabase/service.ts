/**
 * Supabase service-role client — used ONLY in server-side trusted paths.
 * ⚠️  This client bypasses RLS. Never import in client code.
 * 
 * Shared Supabase project with cre-dealcard MVP.
 */
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars not set. Check .env.local.");
  }
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient must not be called on the client.");
  }
  return createClient(url, key);
}

/** Server env vars validation */
export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv must not be called on the client.");
  }
  return {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL ?? "gpt-4o",
    APP_BASE_URL: process.env.APP_BASE_URL ?? "https://cre-fullim.vercel.app",
    MVP_BASE_URL: process.env.MVP_BASE_URL ?? "https://cre-dealcard.vercel.app",
  };
}
