create or replace function public.search_skills(
  query           text,
  level_filter    text default null,
  category_filter text default null
)
returns setof public.skills
language sql stable as $$
  select s.*
  from public.skills s,
       websearch_to_tsquery('english', query) q
  where
    s.search_vector @@ q
    and (level_filter    is null or s.level    = level_filter)
    and (category_filter is null or s.category = category_filter)
  order by
    ts_rank(s.search_vector, q) desc
  limit 20;
$$;
