create extension if not exists vector;

alter table public.skills add column if not exists embedding vector(768);

create index if not exists skills_embedding_idx
  on public.skills using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_skills(
  query_embedding vector(768),
  match_threshold float,
  match_count     int,
  exclude_id      uuid
)
returns table(id uuid, name text, similarity float)
language sql stable as $$
  select id, name, 1 - (embedding <=> query_embedding) as similarity
  from public.skills
  where id != exclude_id
    and embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
