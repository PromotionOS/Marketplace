import { createSupabaseClient } from '@/lib/supabase'
import ReadOnlyGraphView from '@/components/ReadOnlyGraphView'
import type { Skill, SkillEdge, Profile } from '@/lib/types'

export default async function GraphPage() {
  const supabase = await createSupabaseClient()

  const [{ data: skills }, { data: edges }] = await Promise.all([
    supabase.from('skills').select('*'),
    supabase.from('skill_edges').select('*').eq('approved', true),
  ])

  const skillIds = ((skills as Skill[]) ?? []).map((s) => s.id)

  const { data: skillsWithProfiles } = skillIds.length > 0
    ? await supabase
        .from('skills')
        .select('id, submitted_by, profiles:submitted_by(id, full_name, avatar_url)')
        .in('id', skillIds)
    : { data: [] }

  const holderMap: Record<string, { count: number; holders: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[] }> = {}
  for (const s of (skillsWithProfiles ?? []) as unknown as Array<{ id: string; profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null }>) {
    if (s.profiles) {
      holderMap[s.id] = { count: 1, holders: [s.profiles] }
    }
  }

  const enrichedSkills = ((skills as Skill[]) ?? []).map((s) => ({
    ...s,
    holder_count: holderMap[s.id]?.count ?? 1,
    holders: holderMap[s.id]?.holders ?? [],
  }))

  return (
    <div className="-mx-4 -my-6" style={{ height: 'calc(100vh - 64px)' }}>
      <ReadOnlyGraphView
        skills={enrichedSkills}
        edges={(edges as SkillEdge[]) ?? []}
      />
    </div>
  )
}
