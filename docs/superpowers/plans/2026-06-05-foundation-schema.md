# Foundation Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the database schema — add skill taxonomy, check constraints, unique constraints, typed evidence, teams table, and seed 80 canonical skills.

**Architecture:** 3 new Supabase migrations (006, 007, 008) applied on top of existing schema. No app code changes — only DB changes that make data clean and queryable.

**Tech Stack:** PostgreSQL, Supabase migrations

---

## Task 1: Migration 006 — Constraints and Teams

Create `supabase/migrations/006_constraints_teams.sql`:

```sql
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
```

---

## Task 2: Migration 007 — Skill Taxonomy

Create `supabase/migrations/007_skill_taxonomy.sql`:

```sql
-- skill taxonomy: canonical skill names with categories and subcategories
create table public.skill_taxonomy (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  category     text not null check (category in ('Backend', 'Frontend', 'DevOps', 'Data', 'Mobile', 'Security', 'AI/ML', 'Other')),
  subcategory  text,
  aliases      text[] default '{}',   -- e.g. ['ReactJS', 'React.js', 'react']
  description  text,
  created_at   timestamptz default now()
);

alter table public.skill_taxonomy enable row level security;
create policy "anyone can read taxonomy" on public.skill_taxonomy for select using (true);
create policy "admins can manage taxonomy" on public.skill_taxonomy for all using (
  exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
);

-- add FK from skills to taxonomy (optional — allows custom skills not in taxonomy)
alter table public.skills add column if not exists taxonomy_id uuid references public.skill_taxonomy(id) on delete set null;

-- seed Backend skills
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Go',           'Backend', 'Languages',  '{"Golang"}'),
  ('Python',       'Backend', 'Languages',  '{"py", "Python3"}'),
  ('Java',         'Backend', 'Languages',  '{"Java 17", "Java 11"}'),
  ('Node.js',      'Backend', 'Languages',  '{"NodeJS", "Node"}'),
  ('Rust',         'Backend', 'Languages',  '{}'),
  ('PostgreSQL',   'Backend', 'Databases',  '{"Postgres", "psql"}'),
  ('MySQL',        'Backend', 'Databases',  '{}'),
  ('Redis',        'Backend', 'Databases',  '{}'),
  ('MongoDB',      'Backend', 'Databases',  '{"Mongo"}'),
  ('GraphQL',      'Backend', 'APIs',       '{}'),
  ('REST APIs',    'Backend', 'APIs',       '{"RESTful APIs", "REST"}'),
  ('gRPC',         'Backend', 'APIs',       '{}'),
  ('Kafka',        'Backend', 'Messaging',  '{"Apache Kafka"}'),
  ('RabbitMQ',     'Backend', 'Messaging',  '{}'),
  ('Elasticsearch','Backend', 'Search',     '{"ES", "Elastic"}'),
  ('Microservices','Backend', 'Architecture','{}'),
  ('System Design','Backend', 'Architecture','{}');

-- seed Frontend skills
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('React',        'Frontend', 'Frameworks', '{"ReactJS", "React.js", "React 18"}'),
  ('Next.js',      'Frontend', 'Frameworks', '{"NextJS", "Next"}'),
  ('TypeScript',   'Frontend', 'Languages',  '{"TS"}'),
  ('JavaScript',   'Frontend', 'Languages',  '{"JS", "ES6"}'),
  ('Vue.js',       'Frontend', 'Frameworks', '{"Vue", "VueJS"}'),
  ('Angular',      'Frontend', 'Frameworks', '{}'),
  ('Tailwind CSS', 'Frontend', 'Styling',    '{"Tailwind"}'),
  ('CSS',          'Frontend', 'Styling',    '{"CSS3"}'),
  ('HTML',         'Frontend', 'Markup',     '{"HTML5"}'),
  ('React Native', 'Mobile',   'Frameworks', '{"RN"}'),
  ('Figma',        'Frontend', 'Design',     '{}'),
  ('Web Performance','Frontend','Optimization','{"Core Web Vitals"}');

-- seed DevOps skills
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Kubernetes',   'DevOps', 'Orchestration', '{"K8s"}'),
  ('Docker',       'DevOps', 'Containers',    '{}'),
  ('AWS',          'DevOps', 'Cloud',         '{"Amazon Web Services"}'),
  ('GCP',          'DevOps', 'Cloud',         '{"Google Cloud"}'),
  ('Azure',        'DevOps', 'Cloud',         '{"Microsoft Azure"}'),
  ('Terraform',    'DevOps', 'IaC',           '{}'),
  ('Ansible',      'DevOps', 'IaC',           '{}'),
  ('CI/CD',        'DevOps', 'Automation',    '{"GitHub Actions", "Jenkins"}'),
  ('Linux',        'DevOps', 'Systems',       '{"Unix"}'),
  ('Prometheus',   'DevOps', 'Monitoring',    '{}'),
  ('Grafana',      'DevOps', 'Monitoring',    '{}'),
  ('Nginx',        'DevOps', 'Networking',    '{}');

-- seed Data skills
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Apache Spark', 'Data', 'Processing',   '{"Spark", "PySpark"}'),
  ('Apache Airflow','Data','Orchestration', '{"Airflow"}'),
  ('dbt',          'Data', 'Transformation','{"data build tool"}'),
  ('SQL',          'Data', 'Languages',    '{"BigQuery SQL", "Snowflake SQL"}'),
  ('Python',       'Data', 'Languages',    '{"pandas", "numpy"}'),
  ('Snowflake',    'Data', 'Warehouses',   '{}'),
  ('BigQuery',     'Data', 'Warehouses',   '{}'),
  ('Redshift',     'Data', 'Warehouses',   '{"AWS Redshift"}'),
  ('Power BI',     'Data', 'Visualization','{}'),
  ('Tableau',      'Data', 'Visualization','{}'),
  ('Data Modeling','Data', 'Architecture', '{}'),
  ('ETL/ELT',      'Data', 'Pipelines',    '{"ETL", "ELT"}');

-- seed AI/ML skills
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Machine Learning','AI/ML','Core',       '{"ML"}'),
  ('PyTorch',      'AI/ML', 'Frameworks',   '{}'),
  ('TensorFlow',   'AI/ML', 'Frameworks',   '{}'),
  ('LLMs',         'AI/ML', 'GenAI',        '{"Large Language Models"}'),
  ('RAG',          'AI/ML', 'GenAI',        '{"Retrieval Augmented Generation"}'),
  ('MLOps',        'AI/ML', 'Operations',   '{}'),
  ('Computer Vision','AI/ML','Specialization','{"CV"}'),
  ('NLP',          'AI/ML', 'Specialization','{"Natural Language Processing"}');

-- seed Security skills
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Application Security','Security','AppSec', '{"AppSec"}'),
  ('Penetration Testing', 'Security','Testing', '{"PenTesting", "Pentest"}'),
  ('Zero Trust',          'Security','Architecture','{}'),
  ('IAM',                 'Security','Identity', '{"Identity & Access Management"}'),
  ('SIEM',                'Security','Monitoring','{}');
```

---

## Task 3: Migration 008 — Typed Evidence and Proficiency Anchors

Create `supabase/migrations/008_evidence_proficiency.sql`:

```sql
-- evidence type enum replacement: add typed evidence table
-- instead of evidence_urls text[], we add a separate evidence table
create table public.skill_evidence (
  id           uuid primary key default gen_random_uuid(),
  skill_id     uuid references public.skills(id) on delete cascade,
  url          text not null,
  evidence_type text not null check (evidence_type in ('github_pr', 'github_repo', 'certificate', 'article', 'shipped_product', 'other')),
  title        text,
  created_at   timestamptz default now()
);

alter table public.skill_evidence enable row level security;
create policy "anyone can read evidence" on public.skill_evidence for select using (true);
create policy "owner can manage evidence" on public.skill_evidence for all using (
  auth.uid()::text = (select submitted_by::text from public.skills where id = skill_id)
);

-- proficiency_anchor replaces years_experience + last_used_year
-- stored as a single anchored level descriptor
alter table public.skills add column if not exists proficiency_anchor text 
  check (proficiency_anchor in ('follow_tutorials', 'build_independently', 'architect_and_mentor'));

alter table public.skills add column if not exists is_primary boolean default false;
alter table public.skills add column if not exists available_to_mentor boolean default false;
alter table public.skills add column if not exists context text;  -- "What have you built with this?"

-- migrate existing evidence_urls into skill_evidence table
insert into public.skill_evidence (skill_id, url, evidence_type)
select id, unnest(evidence_urls), 'other'
from public.skills
where cardinality(evidence_urls) > 0;

-- evidence type scoring weights (used by scoring function)
create table public.evidence_type_weights (
  evidence_type text primary key,
  points        int not null
);

insert into public.evidence_type_weights values
  ('github_pr',        20),
  ('shipped_product',  18),
  ('certificate',      15),
  ('github_repo',      10),
  ('article',          8),
  ('other',            5);
```

---

## Task 4: Apply Migrations and Update Types

### 4a. Apply migrations

```bash
cd /Users/zop5943/marketplace/skillos
supabase db push
```

### 4b. Update `lib/types.ts`

Add the following new types and update the `Skill` interface:

```ts
export interface Team {
  id: string
  name: string
  department: string | null
  created_at: string
}

export interface SkillTaxonomy {
  id: string
  name: string
  category: string
  subcategory: string | null
  aliases: string[]
  description: string | null
}

export type EvidenceType = 'github_pr' | 'github_repo' | 'certificate' | 'article' | 'shipped_product' | 'other'
export type ProficiencyAnchor = 'follow_tutorials' | 'build_independently' | 'architect_and_mentor'

export interface SkillEvidence {
  id: string
  skill_id: string
  url: string
  evidence_type: EvidenceType
  title: string | null
  created_at: string
}

// Update Skill interface to add new fields
export interface Skill {
  id: string
  name: string
  description: string
  category: string
  level: Level
  tags: string[]
  evidence_urls: string[]          // kept for backwards compat
  years_experience: number | null  // kept for backwards compat
  last_used_year: number | null    // kept for backwards compat
  submitted_by: string
  score: number
  badge: Badge
  taxonomy_id: string | null
  proficiency_anchor: ProficiencyAnchor | null
  is_primary: boolean
  available_to_mentor: boolean
  context: string | null
  created_at: string
  updated_at: string
}
```

### 4c. Commit all files

```bash
git add supabase/migrations/006_constraints_teams.sql
git add supabase/migrations/007_skill_taxonomy.sql  
git add supabase/migrations/008_evidence_proficiency.sql
git add lib/types.ts
git commit -m "feat: foundation schema — taxonomy, constraints, typed evidence, proficiency anchors"
git push
```
