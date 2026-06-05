import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import AdminGraphView from '@/components/AdminGraphView'
import type { Skill, SkillEdge } from '@/lib/types'

export default async function AdminGraphPage() {
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId!).single()
  if (profile?.role !== 'admin') redirect('/graph')

  const [{ data: skills }, { data: approvedEdges }, { data: pendingEdges }] = await Promise.all([
    supabase.from('skills').select('*'),
    supabase.from('skill_edges').select('*').eq('approved', true),
    supabase.from('skill_edges').select('*').eq('approved', false).eq('ai_suggested', true),
  ])

  return (
    <div className="-mx-4 -my-6" style={{ height: 'calc(100vh - 64px)' }}>
      <AdminGraphView
        skills={(skills as Skill[]) ?? []}
        approvedEdges={(approvedEdges as SkillEdge[]) ?? []}
        pendingEdges={(pendingEdges as SkillEdge[]) ?? []}
      />
    </div>
  )
}
