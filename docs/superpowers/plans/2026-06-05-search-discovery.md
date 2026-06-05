# Search & Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the platform actually useful for finding people and skills — add person search, team filtering, "who has this skill" on skill detail, fix search to handle variants, add pagination.

**Architecture:** New Supabase RPC `search_people`. New `/people` page. Skill detail page gains a "People with this skill" section. SearchBar gains a people/skills toggle. Depends on Sub-Project 1 (teams table).

**Tech Stack:** Next.js 16, Supabase JS v2, TypeScript, Tailwind v4

---

## Task 1: Migration 010 — People search RPC and team-aware skill search

Create `supabase/migrations/010_search_people.sql`:

```sql
-- search people by name or skill
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

-- improve skill search to handle taxonomy aliases
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
    -- FTS on the skill itself
    s.search_vector @@ websearch_to_tsquery('english', query)
    -- or name/description ilike for short queries
    or s.name ilike '%' || query || '%'
    -- or taxonomy alias match
    or exists (
      select 1 from unnest(t.aliases) alias
      where alias ilike '%' || query || '%'
    )
  )
  and (level_filter    is null or s.level    = level_filter)
  and (category_filter is null or s.category = category_filter)
  order by
    ts_rank(s.search_vector, websearch_to_tsquery('english', query)) desc,
    s.score desc
  limit page_size
  offset page_offset;
$$;
```

---

## Task 2: PersonCard component

Create `components/PersonCard.tsx`:

```tsx
import Link from 'next/link'

interface Props {
  person: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    role: string
    team: string | null
    skill_count: number
    top_skills: string[] | null
  }
}

export default function PersonCard({ person }: Props) {
  const initials = (person.full_name ?? person.email)[0].toUpperCase()

  return (
    <Link
      href={`/profile/${person.id}`}
      className="block bg-white rounded-2xl elevation-1 p-5 card-hover animate-fade-up"
    >
      <div className="flex items-center gap-4 mb-4">
        {person.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatar_url} alt={person.full_name ?? ''} className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <span className="text-xl font-black text-orange-500">{initials}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 truncate">{person.full_name ?? 'Unknown'}</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {person.team ? `${person.team} · ` : ''}<span className="capitalize">{person.role}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black text-orange-500">{person.skill_count}</p>
          <p className="text-xs text-gray-400">skills</p>
        </div>
      </div>

      {person.top_skills && person.top_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {person.top_skills.slice(0, 4).map((skill) => (
            <span key={skill} className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium">
              {skill}
            </span>
          ))}
          {person.top_skills.length > 4 && (
            <span className="text-xs text-gray-400 px-2 py-1">+{person.top_skills.length - 4} more</span>
          )}
        </div>
      )}
    </Link>
  )
}
```

---

## Task 3: /people page

Create `app/(app)/people/page.tsx`:

```tsx
import { Suspense } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import PersonCard from '@/components/PersonCard'
import CustomSelect from '@/components/CustomSelect'

interface Props {
  searchParams: Promise<{ q?: string; team?: string; skill?: string }>
}

async function PeopleList({ searchParams }: Props) {
  const { q, team, skill } = await searchParams
  const supabase = await createSupabaseClient()

  const { data: people } = await supabase.rpc('search_people', {
    query: q ?? '',
    team_filter: team ?? null,
    skill_filter: skill ?? null,
  })

  const { data: teams } = await supabase.from('teams').select('name').order('name')

  return (
    <>
      {(people?.length ?? 0) === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">👤</p>
          <p className="text-gray-400 font-medium">No people found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {(people as Array<{
            id: string; full_name: string | null; email: string; avatar_url: string | null;
            role: string; team: string | null; skill_count: number; top_skills: string[] | null
          }>).map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </>
  )
}

export default function PeoplePage({ searchParams }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">People</h1>
          <p className="text-gray-400 text-sm mt-1">Find teammates by skill or team</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl elevation-1 p-5 h-32 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      }>
        <PeopleList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
```

---

## Task 4: Add "Who has this skill" to skill detail page

Update `app/(app)/skills/[id]/page.tsx` — after the existing description/evidence section, add a "Team members with this skill" section.

Add this query alongside existing queries:

```tsx
const { data: otherHolders } = await supabase
  .from('skills')
  .select('submitted_by, score, level, profiles:submitted_by(id, full_name, avatar_url, team)')
  .eq('name', skill.name)  // same skill name
  .neq('submitted_by', skill.submitted_by)  // exclude current submitter
  .order('score', { ascending: false })
  .limit(10)
```

Add this section in the JSX after description card:

```tsx
{otherHolders && otherHolders.length > 0 && (
  <div className="bg-white rounded-2xl elevation-1 p-6">
    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
      Others with this skill ({otherHolders.length})
    </h2>
    <div className="space-y-3">
      {(otherHolders as Array<{
        submitted_by: string; score: number; level: string;
        profiles: { id: string; full_name: string | null; avatar_url: string | null; team: string | null }
      }>).map((holder) => (
        <Link key={holder.submitted_by} href={`/profile/${holder.profiles.id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors">
          {holder.profiles.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={holder.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-xs font-bold text-orange-500">
                {(holder.profiles.full_name ?? '?')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{holder.profiles.full_name ?? 'Unknown'}</p>
            {holder.profiles.team && <p className="text-xs text-gray-400">{holder.profiles.team}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-black text-orange-500">{holder.score}/100</p>
            <p className="text-xs text-gray-400 capitalize">{holder.level}</p>
          </div>
        </Link>
      ))}
    </div>
  </div>
)}
```

---

## Task 5: Add People to Nav

Update `components/Nav.tsx` — replace the links array with:

```tsx
const links = [
  { href: '/skills',  label: 'Skills' },
  { href: '/people',  label: 'People' },
  { href: '/graph',   label: 'Graph' },
]
```

---

## Commit

```bash
git add supabase/migrations/010_search_people.sql
git add components/PersonCard.tsx
git add app/'(app)'/people/page.tsx
git add app/'(app)'/skills/'[id]'/page.tsx
git add components/Nav.tsx
git commit -m "feat: people search, /people page, who-has-this-skill on detail, nav update"
git push
```
