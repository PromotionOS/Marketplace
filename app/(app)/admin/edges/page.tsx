import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { approveEdge, rejectEdge } from '@/app/actions/skills'
import type { Skill, SkillEdge } from '@/lib/types'

export default async function AdminEdgesPage() {
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId!).single()
  if (profile?.role !== 'admin') redirect('/skills')

  const { data: pendingEdges } = await supabase
    .from('skill_edges').select('*')
    .eq('approved', false).eq('ai_suggested', true)
    .order('created_at', { ascending: false })

  const skillIds = [...new Set(((pendingEdges as SkillEdge[]) ?? []).flatMap((e) => [e.source_id, e.target_id]))]
  const { data: skills } = skillIds.length > 0
    ? await supabase.from('skills').select('id, name, category').in('id', skillIds)
    : { data: [] }

  const skillMap = Object.fromEntries(
    ((skills as Pick<Skill, 'id' | 'name' | 'category'>[]) ?? []).map((s) => [s.id, s])
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">AI-Suggested Edges</h1>
        <p className="text-gray-400 text-sm mt-1">Connections suggested by the AI based on skill similarity</p>
      </div>

      {(pendingEdges?.length ?? 0) === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl elevation-1">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-gray-400 font-medium">All caught up — no pending edges to review.</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {(pendingEdges as SkillEdge[]).map((edge) => {
            const src = skillMap[edge.source_id]
            const tgt = skillMap[edge.target_id]
            return (
              <div key={edge.id} className="bg-white rounded-2xl elevation-1 p-5 animate-fade-up flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">
                    {src?.name ?? '?'}
                    <span className="text-orange-400 mx-2">→</span>
                    {tgt?.name ?? '?'}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {edge.relation_type} · similarity {Number(edge.weight).toFixed(2)} · AI suggested
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={approveEdge.bind(null, edge.id)}>
                    <button type="submit"
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold hover:bg-green-200 transition-colors">
                      ✓ Approve
                    </button>
                  </form>
                  <form action={rejectEdge.bind(null, edge.id)}>
                    <button type="submit"
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors">
                      ✕ Reject
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
