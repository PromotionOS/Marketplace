import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminPage() {
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId!).single()
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

  const stats = [
    { label: 'Total Skills', value: skillCount ?? 0, emoji: '🧠', color: '#f97316', bg: '#fff7ed' },
    { label: 'Team Members', value: userCount ?? 0,  emoji: '👥', color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Pending Edges', value: pendingEdgeCount ?? 0, emoji: '🔗', color: '#7c3aed', bg: '#ede9fe' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the SkillOS platform</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8 stagger">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl elevation-1 p-6 animate-fade-up" style={{ borderTop: `3px solid ${stat.color}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.emoji}</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className="text-4xl font-black" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl elevation-1 p-6">
        <h2 className="font-bold text-gray-900 mb-1">AI-Suggested Edges</h2>
        <p className="text-sm text-gray-400 mb-4">Review connections suggested by the AI and approve or reject them</p>
        <Link href="/admin/edges"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all">
          Review Edges
          {(pendingEdgeCount ?? 0) > 0 && (
            <span className="bg-white text-orange-500 text-xs font-black px-2 py-0.5 rounded-full">
              {pendingEdgeCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  )
}
