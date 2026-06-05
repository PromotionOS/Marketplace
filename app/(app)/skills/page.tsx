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
    let query = supabase.from('skills').select('*').order('score', { ascending: false })
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
      <div className="mb-6">
        <SearchBar resultCount={skills.length} />
      </div>
      {skills.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-400 font-medium">No skills found. Be the first to add one!</p>
          <Link href="/skills/new" className="mt-4 inline-block text-orange-500 font-semibold hover:underline">
            Add a skill →
          </Link>
        </div>
      ) : (
        <RealtimeSkillList initialSkills={skills} initialEndorsementCounts={endorsementCounts} />
      )}
    </>
  )
}

export default function SkillsPage({ searchParams }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Skills</h1>
          <p className="text-gray-400 text-sm mt-1">Browse and discover skills across your org</p>
        </div>
        <Link
          href="/skills/new"
          className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all elevation-1"
        >
          + Add Skill
        </Link>
      </div>

      <Suspense fallback={
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl elevation-1 p-5 h-40 animate-pulse">
              <div className="h-4 bg-orange-100 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-2 bg-orange-100 rounded-full" />
            </div>
          ))}
        </div>
      }>
        <SkillList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
