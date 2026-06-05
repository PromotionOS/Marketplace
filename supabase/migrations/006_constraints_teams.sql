-- teams table
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  department  text,
  created_at  timestamptz default now()
);

alter table public.teams enable row level security;
create policy "anyone can read teams" on public.teams for select using (true);
create policy "admins can manage teams" on public.teams for all using (
  exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
);

-- seed initial teams
insert into public.teams (name, department) values
  ('Engineering',       'Technology'),
  ('Data Engineering',  'Technology'),
  ('Frontend',          'Technology'),
  ('DevOps',            'Technology'),
  ('Product',           'Product'),
  ('Design',            'Product'),
  ('Data Science',      'Analytics'),
  ('Analytics',         'Analytics');

-- migrate profiles.team from free text to FK
alter table public.profiles add column if not exists team_id uuid references public.teams(id) on delete set null;
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- add check constraints on skills
alter table public.skills add constraint skills_level_check
  check (level in ('beginner', 'proficient', 'expert'));

alter table public.skills add constraint skills_category_check
  check (category in ('Backend', 'Frontend', 'DevOps', 'Data', 'Mobile', 'Security', 'AI/ML', 'Other'));

-- add unique constraint: one skill entry per person per canonical skill name
alter table public.skills add constraint skills_unique_per_user
  unique (submitted_by, name);

-- add check constraint on skill_edges relation_type
alter table public.skill_edges add constraint skill_edges_relation_type_check
  check (relation_type in ('prerequisite', 'complements', 'leads_to', 'workflow'));

-- add index on skill_edges.approved for faster graph queries
create index if not exists skill_edges_approved_idx on public.skill_edges (approved) where approved = true;

-- add index on skills.submitted_by for profile pages
create index if not exists skills_submitted_by_idx on public.skills (submitted_by);

-- add index on endorsements.skill_id
create index if not exists endorsements_skill_id_idx on public.endorsements (skill_id);
