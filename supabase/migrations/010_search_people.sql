create or replace function public.search_people(
  query          text,
  team_filter    text default null,
  skill_filter   text default null
)
returns table(
  id          uuid,
  full_name   text,
  email       text,
  avatar_url  text,
  role        text,
  team        text,
  skill_count bigint,
  top_skills  text[]
)
language sql stable as $$
  select
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.role,
    p.team,
    count(distinct s.id) as skill_count,
    array_agg(distinct s.name order by s.score desc) filter (where s.id is not null) as top_skills
  from public.profiles p
  left join public.skills s on s.submitted_by = p.id
  where
    (
      query is null or query = '' or
      p.full_name ilike '%' || query || '%' or
      p.email ilike '%' || query || '%'
    )
    and (team_filter is null or p.team = team_filter)
    and (
      skill_filter is null or
      exists (
        select 1 from public.skills sk
        where sk.submitted_by = p.id
        and sk.name ilike '%' || skill_filter || '%'
      )
    )
  group by p.id, p.full_name, p.email, p.avatar_url, p.role, p.team
  order by skill_count desc, p.full_name asc
  limit 30;
$$;

create or replace function public.search_skills(
  query           text,
  level_filter    text default null,
  category_filter text default null,
  page_size       int default 20,
  page_offset     int default 0
)
returns setof public.skills
language sql stable as $$
  select s.*
  from public.skills s
  left join public.skill_taxonomy t on t.id = s.taxonomy_id
  where (
    s.search_vector @@ websearch_to_tsquery('english', query)
    or s.name ilike '%' || query || '%'
  )
  and (level_filter    is null or s.level    = level_filter)
  and (category_filter is null or s.category = category_filter)
  order by
    ts_rank(s.search_vector, websearch_to_tsquery('english', query)) desc,
    s.score desc
  limit page_size
  offset page_offset;
$$;
