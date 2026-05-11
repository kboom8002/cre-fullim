-- Create storage buckets for JS Full IM Studio

INSERT INTO storage.buckets (id, name, public) VALUES 
('full-im-evidence-private', 'full-im-evidence-private', false),
('full-im-export-private', 'full-im-export-private', false),
('full-im-export-shared', 'full-im-export-shared', false),
('full-im-thumbnails', 'full-im-thumbnails', true);

-- RLS for evidence-private
CREATE POLICY "Project members can view evidence" ON storage.objects
FOR SELECT USING (
  bucket_id = 'full-im-evidence-private' AND 
  EXISTS (
    SELECT 1 FROM im_project_members 
    WHERE user_id = auth.uid()
  )
);

-- RLS for export-private
CREATE POLICY "Project members can view private exports" ON storage.objects
FOR SELECT USING (
  bucket_id = 'full-im-export-private' AND 
  EXISTS (
    SELECT 1 FROM im_project_members 
    WHERE user_id = auth.uid()
  )
);

-- RLS for export-shared
CREATE POLICY "Anyone can view shared exports if they have the link" ON storage.objects
FOR SELECT USING (
  bucket_id = 'full-im-export-shared'
);

-- Note: these are basic placeholders. A real app will join with the specific project_id 
-- stored in the object's path or metadata.
