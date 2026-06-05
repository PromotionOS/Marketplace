import { Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import SearchBar from '@/components/SearchBar'
import RealtimeSkillList from '@/components/RealtimeSkillList'
import type { Skill } from '@/lib/types'

interface Props {
  searchParams: Promise<{ q?: string; level?: string; category?: string }>
}

async function SkillList({ searchParams }: Props) {
  const { q, level, category } = await searchParams
  const supabase = await createSupabaseClient()
  let skills: Skill[] = []

  if (q) {
    const { data } = await supabase.rpc('search_skills', {
      query: q,
      level_filter: level ?? null,
      category_filter: category ?? null,
    })
    skills = (data as Skill[]) ?? []
  } else {
    let query = supabase.from('skills').select('*').order('created_at', { ascending: false })
    if (level) query = query.eq('level', level)
    if (category) query = query.eq('category', category)
    const { data } = await query
    skills = (data as Skill[]) ?? []
  }

  const skillIds = skills.map((s) => s.id)
  const { data: endorsements } = skillIds.length > 0
    ? await supabase.from('endorsements').select('skill_id').in('skill_id', skillIds)
    : { data: [] }

  const endorsementCounts: Record<string, number> = {}
  for (const e of endorsements ?? []) {
    endorsementCounts[e.skill_id] = (endorsementCounts[e.skill_id] ?? 0) + 1
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <SearchBar resultCount={skills.length} />
        <Link
          href="/skills/new"
          className="ml-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 whitespace-nowrap"
        >
          + Add Skill
        </Link>
      </div>
      {skills.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No skills found. Be the first to add one!</p>
      ) : (
        <RealtimeSkillList initialSkills={skills} initialEndorsementCounts={endorsementCounts} />
      )}
    </>
  )
}

export default function SkillsPage({ searchParams }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Skills</h1>
      <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
        <SkillList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
