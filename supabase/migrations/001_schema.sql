-- profiles
create table public.profiles (
  id           uuid primary key,
  email        text not null unique,
  full_name    text,
  avatar_url   text,
  role         text not null default 'member',
  team         text,
  created_at   timestamptz default now()
);

-- skills
create table public.skills (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text not null,
  category         text not null,
  level            text not null,
  tags             text[] default '{}',
  evidence_urls    text[] default '{}',
  years_experience numeric(4,1),
  last_used_year   int,
  submitted_by     uuid references public.profiles(id) on delete cascade,
  score            int not null default 0,
  badge            text not null default 'none',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  search_vector    tsvector
);

create index skills_search_idx on public.skills using gin(search_vector);

-- populate search_vector on insert/update
create or replace function public.skills_search_vector_update() returns trigger as $$
begin
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'A');
  return NEW;
end;
$$ language plpgsql;

create trigger skills_search_vector_trigger
  before insert or update of name, description, tags
  on public.skills for each row execute function public.skills_search_vector_update();

-- endorsements
create table public.endorsements (
  id           uuid primary key default gen_random_uuid(),
  skill_id     uuid references public.skills(id) on delete cascade,
  endorsed_by  uuid references public.profiles(id) on delete cascade,
  note         text,
  created_at   timestamptz default now(),
  unique(skill_id, endorsed_by)
);

-- skill_edges
create table public.skill_edges (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid references public.skills(id) on delete cascade,
  target_id     uuid references public.skills(id) on delete cascade,
  relation_type text not null,
  weight        numeric(3,2) default 1.0,
  ai_suggested  boolean default false,
  approved      boolean default false,
  created_at    timestamptz default now(),
  unique(source_id, target_id)
);

-- skill_requests
create table public.skill_requests (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  category     text,
  requested_by uuid references public.profiles(id) on delete cascade,
  status       text default 'open',
  created_at   timestamptz default now()
);

-- audit_log
create table public.audit_log (
  id         bigserial primary key,
  table_name text,
  operation  text,
  row_id     uuid,
  actor_id   uuid,
  diff       jsonb,
  created_at timestamptz default now()
);

-- audit trigger function
create or replace function public.audit_trigger_fn() returns trigger as $$
begin
  insert into public.audit_log(table_name, operation, row_id, actor_id, diff)
  values (
    TG_TABLE_NAME, TG_OP,
    coalesce(NEW.id, OLD.id),
    auth.uid(),
    case TG_OP
      when 'INSERT' then to_jsonb(NEW)
      when 'UPDATE' then jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      when 'DELETE' then to_jsonb(OLD)
    end
  );
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger audit_skills
  after insert or update or delete on public.skills
  for each row execute function public.audit_trigger_fn();

create trigger audit_endorsements
  after insert or update or delete on public.endorsements
  for each row execute function public.audit_trigger_fn();

create trigger audit_skill_edges
  after insert or update or delete on public.skill_edges
  for each row execute function public.audit_trigger_fn();
