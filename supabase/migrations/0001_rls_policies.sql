-- Enable RLS on all tables
ALTER TABLE handoff_source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_ssot_full ENABLE ROW LEVEL SECURITY;
ALTER TABLE im_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE im_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE im_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE im_section_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealroom_qna_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealroom_qna_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_im_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;

-- Note: In a real Supabase environment, auth.uid() would be used. 
-- For this pilot, if custom headers are used, we might rely on service role or a custom claim.
-- Below are basic RLS policies assuming auth.uid() is used for user_id.

-- Admin can manage all (assuming admin is determined by a function or claim, here we just allow service_role)
-- For simplicity in this schema, we allow all for authenticated users as a baseline,
-- but restrict based on project_members for actual usage.

-- IM Projects
CREATE POLICY "Users can view projects they are a member of" ON im_projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM im_project_members 
      WHERE project_id = im_projects.id 
      AND user_id = auth.uid()
    )
  );

-- Project Members
CREATE POLICY "Users can view project members of their projects" ON im_project_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM im_project_members m 
      WHERE m.project_id = im_project_members.project_id 
      AND m.user_id = auth.uid()
    )
  );

-- Sections
CREATE POLICY "Users can view sections of their projects" ON im_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM im_project_members 
      WHERE project_id = im_sections.project_id 
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM expert_assignments
      WHERE expert_id = auth.uid() 
      AND section_id = im_sections.id
    )
  );

-- Expert Assignments
CREATE POLICY "Experts can view their assignments" ON expert_assignments
  FOR SELECT
  USING (
    expert_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM im_project_members 
      WHERE project_id = expert_assignments.project_id 
      AND user_id = auth.uid()
    )
  );

-- Expert Patches
CREATE POLICY "Experts can view/manage their patches" ON expert_patches
  FOR ALL
  USING (
    expert_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM im_project_members 
      WHERE project_id = expert_patches.project_id 
      AND user_id = auth.uid()
    )
  );

-- Building SSoT Full
CREATE POLICY "Users can view BSSoT of their projects" ON building_ssot_full
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM im_projects 
      WHERE building_ssot_full_id = building_ssot_full.id 
      AND EXISTS (
        SELECT 1 FROM im_project_members 
        WHERE project_id = im_projects.id 
        AND user_id = auth.uid()
      )
    )
  );

-- Allow all for service_role
-- (Supabase does this by default for the postgres service_role, but good to note)
