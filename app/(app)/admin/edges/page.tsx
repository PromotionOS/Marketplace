import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { approveEdge, rejectEdge } from '@/app/actions/skills'
import type { Skill, SkillEdge } from '@/lib/types'

export default async function AdminEdgesPage() {
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId!)
    .single()

  if (profile?.role !== 'admin') redirect('/skills')

  const { data: pendingEdges } = await supabase
    .from('skill_edges')
    .select('*')
    .eq('approved', false)
    .eq('ai_suggested', true)
    .order('created_at', { ascending: false })

  const skillIds = [
    ...new Set(((pendingEdges as SkillEdge[]) ?? []).flatMap((e) => [e.source_id, e.target_id])),
  ]
  const { data: skills } = skillIds.length > 0
    ? await supabase.from('skills').select('id, name, category').in('id', skillIds)
    : { data: [] }

  const skillMap = Object.fromEntries(
    ((skills as Pick<Skill, 'id' | 'name' | 'category'>[]) ?? []).map((s) => [s.id, s])
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI-Suggested Edges</h1>
      {(pendingEdges?.length ?? 0) === 0 ? (
        <p className="text-gray-400">No pending edges to review.</p>
      ) : (
        <div className="space-y-4">
          {(pendingEdges as SkillEdge[]).map((edge) => {
            const src = skillMap[edge.source_id]
            const tgt = skillMap[edge.target_id]
            return (
              <div key={edge.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {src?.name ?? '?'} → {tgt?.name ?? '?'}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {edge.relation_type} · weight {Number(edge.weight).toFixed(2)} · AI suggested
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={approveEdge.bind(null, edge.id)}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectEdge.bind(null, edge.id)}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      Reject
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
