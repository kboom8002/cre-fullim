create table handoff_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  handoff_id text not null,
  source_app text not null default 'js-building-ssot-mvp',
  source_app_version text,
  contracts_version text not null,
  payload_version text not null,
  source_building_ssot_lite_id text not null,
  source_objects jsonb not null default '{}',
  import_status text not null default 'pending',
  warnings text[] not null default '{}',
  imported_by uuid,
  imported_at timestamptz default now(),
  created_at timestamptz default now()
);

create index idx_handoff_snapshots_handoff_id on handoff_source_snapshots(handoff_id);
create index idx_handoff_snapshots_source_bsl on handoff_source_snapshots(source_building_ssot_lite_id);

create table building_ssot_full (
  id uuid primary key default gen_random_uuid(),
  source_building_ssot_lite_id text,
  handoff_source_snapshot_id uuid references handoff_source_snapshots(id),

  created_by uuid not null,

  asset_identity jsonb not null default '{}',
  physical_fact jsonb not null default '{}',
  legal_registry jsonb not null default '{}',
  lease_income jsonb not null default '{}',
  market_location jsonb not null default '{}',
  value_up_hypothesis jsonb not null default '{}',
  risk_unknown jsonb not null default '{}',
  buyer_fit jsonb not null default '{}',
  disclosure_gate jsonb not null default '{}',
  evidence_source jsonb not null default '{}',

  b2c_consumer_demand jsonb not null default '{}',
  space_environmental jsonb not null default '{}',
  tenant_operator_management jsonb not null default '{}',
  ai_answer_document_contract jsonb not null default '{}',

  readiness_status text not null default 'lite_imported',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_bssot_full_created_by on building_ssot_full(created_by);
create index idx_bssot_full_source_lite on building_ssot_full(source_building_ssot_lite_id);

create table im_projects (
  id uuid primary key default gen_random_uuid(),

  source_app text not null default 'js-full-im-studio',
  source_building_ssot_lite_id text,
  building_ssot_full_id uuid not null references building_ssot_full(id),

  created_by uuid not null,
  project_owner_id uuid,

  project_type text not null,
  target_output text not null,
  package_intent text default 'unknown',

  status text not null default 'intake',
  readiness_score int check (readiness_score is null or readiness_score between 0 and 100),

  required_expert_patches jsonb not null default '[]',
  source_document_ids text[] not null default '{}',
  source_refs jsonb not null default '[]',

  title text,
  description text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_im_projects_created_by on im_projects(created_by);
create index idx_im_projects_bssot on im_projects(building_ssot_full_id);
create index idx_im_projects_status on im_projects(status);

create table im_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references im_projects(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  status text not null default 'active',
  invited_by uuid,
  created_at timestamptz default now(),

  unique(project_id, user_id, role)
);

create index idx_project_members_user on im_project_members(user_id);
create index idx_project_members_project on im_project_members(project_id);

create table im_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references im_projects(id) on delete cascade,

  section_type text not null,
  section_order int not null,
  title text not null,

  status text not null default 'not_started',
  confidence text not null default 'unknown',
  risk_level text not null default 'medium',

  requires_expert_patch boolean not null default false,
  required_expert_roles text[] not null default '{}',

  missing_data text[] not null default '{}',
  required_evidence text[] not null default '{}',

  content_json jsonb not null default '{}',
  markdown text,

  source_refs jsonb not null default '[]',
  evidence_refs jsonb not null default '[]',

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(project_id, section_type)
);

create index idx_im_sections_project on im_sections(project_id);
create index idx_im_sections_status on im_sections(status);
create index idx_im_sections_type on im_sections(section_type);

create table im_section_versions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references im_sections(id) on delete cascade,
  project_id uuid not null references im_projects(id) on delete cascade,

  version_number int not null,
  version_source text not null,

  content_json jsonb not null default '{}',
  markdown text,

  source_refs jsonb not null default '[]',
  evidence_refs jsonb not null default '[]',

  created_by uuid,
  created_at timestamptz default now(),

  unique(section_id, version_number)
);

create table expert_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  expert_role text not null,
  display_name text,
  organization text,
  license_note text,
  bio text,
  status text not null default 'active',
  created_at timestamptz default now()
);

create index idx_expert_profiles_user on expert_profiles(user_id);
create index idx_expert_profiles_role on expert_profiles(expert_role);

create table expert_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references im_projects(id) on delete cascade,
  section_id uuid references im_sections(id) on delete set null,

  expert_id uuid not null references expert_profiles(id),
  expert_role text not null,

  assignment_type text not null,
  status text not null default 'assigned',

  instructions text,
  due_at timestamptz,

  created_by uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_expert_assignments_project on expert_assignments(project_id);
create index idx_expert_assignments_expert on expert_assignments(expert_id);
create index idx_expert_assignments_status on expert_assignments(status);

create table expert_patches (
  id uuid primary key default gen_random_uuid(),

  assignment_id uuid references expert_assignments(id) on delete set null,
  project_id uuid not null references im_projects(id) on delete cascade,
  section_id uuid references im_sections(id) on delete set null,

  expert_id uuid not null references expert_profiles(id),
  expert_role text not null,

  patch_type text not null,

  before_text text,
  after_text text not null,

  edit_tags text[] not null default '{}',
  rationale text,

  visibility_after_review text not null default 'internal_only',
  requires_additional_review boolean not null default false,
  training_rights text not null default 'not_allowed',

  status text not null default 'draft',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_expert_patches_project on expert_patches(project_id);
create index idx_expert_patches_section on expert_patches(section_id);
create index idx_expert_patches_expert on expert_patches(expert_id);

create table gate_reviews (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null references im_projects(id) on delete cascade,
  target_type text not null,
  target_id uuid,

  gate_type text not null,
  status text not null,

  violations jsonb not null default '[]',
  required_actions text[] not null default '{}',

  reviewed_by uuid,
  reviewed_at timestamptz,

  created_at timestamptz default now()
);

create index idx_gate_reviews_project on gate_reviews(project_id);
create index idx_gate_reviews_gate_type on gate_reviews(gate_type);
create index idx_gate_reviews_status on gate_reviews(status);

create table evidence_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references im_projects(id) on delete cascade,
  building_ssot_full_id uuid references building_ssot_full(id) on delete cascade,

  uploaded_by uuid not null,

  evidence_type text not null,
  title text not null,
  storage_path text,
  source_uri text,

  visibility text not null default 'private_truth',
  review_status text not null default 'uploaded',

  contains_sensitive_data boolean not null default true,
  training_allowed boolean not null default false,

  metadata jsonb not null default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_evidence_project on evidence_files(project_id);
create index idx_evidence_bssot on evidence_files(building_ssot_full_id);
create index idx_evidence_visibility on evidence_files(visibility);

create table export_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references im_projects(id) on delete cascade,

  export_type text not null,
  status text not null default 'queued',

  output_uri text,
  error_message text,

  created_by uuid not null,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table dealroom_qna_packs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references im_projects(id) on delete cascade,

  status text not null default 'draft',
  summary text,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table dealroom_qna_items (
  id uuid primary key default gen_random_uuid(),
  qna_pack_id uuid not null references dealroom_qna_packs(id) on delete cascade,
  project_id uuid not null references im_projects(id) on delete cascade,

  question text not null,
  answer_status text not null default 'draft',
  draft_answer text,
  required_evidence text[] not null default '{}',
  visibility text not null default 'gate_restricted',
  expert_required boolean not null default false,

  created_at timestamptz default now()
);

create table golden_im_candidates (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null references im_projects(id) on delete cascade,
  section_id uuid references im_sections(id) on delete set null,
  expert_patch_id uuid references expert_patches(id) on delete set null,

  section_type text,
  ai_draft text,
  expert_revision text,

  edit_tags text[] not null default '{}',
  redaction_status text not null default 'pending',
  training_rights text not null default 'not_allowed',
  review_status text not null default 'candidate',

  metadata jsonb not null default '{}',

  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create table activity_events (
  id uuid primary key default gen_random_uuid(),

  source_app text not null default 'js-full-im-studio',

  actor_id uuid,
  actor_role text not null default 'system',

  event_name text not null,
  entity_type text not null,
  entity_id text,

  metadata jsonb not null default '{}',

  occurred_at timestamptz default now()
);

create index idx_activity_events_event_name on activity_events(event_name);
create index idx_activity_events_entity on activity_events(entity_type, entity_id);
create index idx_activity_events_actor on activity_events(actor_id);
create index idx_activity_events_occurred_at on activity_events(occurred_at);

create table ai_runs (
  id uuid primary key default gen_random_uuid(),

  project_id uuid references im_projects(id) on delete set null,
  section_id uuid references im_sections(id) on delete set null,

  user_id uuid,
  run_type text not null,

  input_ref jsonb not null default '{}',
  output_ref jsonb not null default '{}',

  model text,
  prompt_version text,

  status text not null default 'started',
  token_usage jsonb,
  latency_ms int,
  error text,

  created_at timestamptz default now()
);
