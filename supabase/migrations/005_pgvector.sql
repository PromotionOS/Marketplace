alter table public.skills add column if not exists embedding extensions.vector(768);

create or replace function public.match_skills(
  query_embedding extensions.vector(768),
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
