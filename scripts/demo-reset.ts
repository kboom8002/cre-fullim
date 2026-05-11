import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import { DEMO_IDS } from "./demo-seed";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function reset() {
  console.log("🔄 Resetting Demo State...");

  // 1. Reset Handoff Snapshot
  await supabase
    .from("handoff_source_snapshots")
    .update({ import_status: "pending_import" })
    .eq("id", DEMO_IDS.SNAPSHOT_ID);

  // 2. Reset IM Project Status to intake
  await supabase
    .from("im_projects")
    .update({ status: "readiness_pending" })
    .eq("id", DEMO_IDS.PROJECT_ID);

  // 3. Optional: Delete Expert Patches created during demo
  await supabase
    .from("expert_patches")
    .delete()
    .eq("project_id", DEMO_IDS.PROJECT_ID);

  // 4. Reset Expert Assignment
  await supabase
    .from("expert_assignments")
    .update({ status: "assigned" })
    .eq("id", DEMO_IDS.ASSIGNMENT_ID);

  // 5. Reset Golden Candidate Status
  await supabase
    .from("golden_im_candidates")
    .update({ review_status: "candidate" })
    .eq("id", DEMO_IDS.GOLDEN_ID);

  console.log("✅ Demo Reset Completed!");
}

reset().catch(console.error);
