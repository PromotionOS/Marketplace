create table public.skill_evidence (
  id            uuid primary key default gen_random_uuid(),
  skill_id      uuid references public.skills(id) on delete cascade,
  url           text not null,
  evidence_type text not null check (evidence_type in ('github_pr', 'github_repo', 'certificate', 'article', 'shipped_product', 'other')),
  title         text,
  created_at    timestamptz default now()
);

alter table public.skill_evidence enable row level security;
create policy "anyone can read evidence" on public.skill_evidence for select using (true);
create policy "owner can manage evidence" on public.skill_evidence for all using (
  auth.uid()::text = (select submitted_by::text from public.skills where id = skill_id)
);

alter table public.skills add column if not exists proficiency_anchor text
  check (proficiency_anchor in ('follow_tutorials', 'build_independently', 'architect_and_mentor'));

alter table public.skills add column if not exists is_primary boolean default false;
alter table public.skills add column if not exists available_to_mentor boolean default false;
alter table public.skills add column if not exists context text;

-- migrate existing evidence_urls into skill_evidence table
insert into public.skill_evidence (skill_id, url, evidence_type)
select id, unnest(evidence_urls), 'other'
from public.skills
where cardinality(evidence_urls) > 0;

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
