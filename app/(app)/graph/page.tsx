import { auth } from '@clerk/nextjs/server'
import { createSupabaseClient } from '@/lib/supabase'
import GraphView from '@/components/GraphView'
import type { Skill, SkillEdge, Profile } from '@/lib/types'

export default async function GraphPage() {
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const [{ data: skills }, { data: edges }, { data: profile }] = await Promise.all([
    supabase.from('skills').select('*'),
    supabase.from('skill_edges').select('*').eq('approved', true),
    supabase.from('profiles').select('role').eq('id', userId!).single(),
  ])

  const isAdmin = (profile as Pick<Profile, 'role'> | null)?.role === 'admin'

  let pendingEdges: SkillEdge[] = []
  if (isAdmin) {
    const { data } = await supabase
      .from('skill_edges')
      .select('*')
      .eq('approved', false)
      .eq('ai_suggested', true)
    pendingEdges = (data as SkillEdge[]) ?? []
  }

  return (
    <div className="-mx-4 -my-6" style={{ height: 'calc(100vh - 64px)' }}>
      <GraphView
        skills={(skills as Skill[]) ?? []}
        edges={(edges as SkillEdge[]) ?? []}
        pendingEdges={pendingEdges}
        isAdmin={isAdmin}
      />
    </div>
  )
}
