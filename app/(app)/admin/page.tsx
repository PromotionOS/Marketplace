import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminPage() {
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId!)
    .single()

  if (profile?.role !== 'admin') redirect('/skills')

  const [
    { count: skillCount },
    { count: userCount },
    { count: pendingEdgeCount },
  ] = await Promise.all([
    supabase.from('skills').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('skill_edges').select('*', { count: 'exact', head: true }).eq('approved', false),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Skills', value: skillCount ?? 0 },
          { label: 'Total Users', value: userCount ?? 0 },
          { label: 'Pending Edges', value: pendingEdgeCount ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <Link
        href="/admin/edges"
        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
      >
        Review AI-Suggested Edges
        {(pendingEdgeCount ?? 0) > 0 && (
          <span className="bg-white text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {pendingEdgeCount}
          </span>
        )}
      </Link>
    </div>
  )
}
