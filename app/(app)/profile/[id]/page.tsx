import { notFound } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import SkillCard from '@/components/SkillCard'
import type { Skill, Profile } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

const BADGE_COLORS: Record<string, { color: string; bg: string; emoji: string }> = {
  expert:     { color: '#b45309', bg: '#fef3c7', emoji: '🏆' },
  proficient: { color: '#7c3aed', bg: '#ede9fe', emoji: '⭐' },
  beginner:   { color: '#0369a1', bg: '#e0f2fe', emoji: '🌱' },
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!profile) notFound()

  const { data: skills } = await supabase
    .from('skills').select('*').eq('submitted_by', id).order('score', { ascending: false })

  const p = profile as Profile
  const skillList = (skills as Skill[]) ?? []

  const badgeCounts = skillList.reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s.badge]: (acc[s.badge] ?? 0) + 1 }), {}
  )
  const avgScore = skillList.length
    ? Math.round(skillList.reduce((sum, s) => sum + s.score, 0) / skillList.length)
    : 0

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-2xl elevation-2 p-8 mb-8">
        <div className="flex items-center gap-6">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt={p.full_name ?? ''} className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center">
              <span className="text-3xl font-black text-orange-500">
                {(p.full_name ?? 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-900">{p.full_name ?? 'Unknown'}</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {p.team ? `${p.team} · ` : ''}<span className="capitalize">{p.role}</span>
            </p>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-2xl font-black text-orange-500">{skillList.length}</p>
                <p className="text-xs text-gray-400">Skills</p>
              </div>
              <div>
                <p className="text-2xl font-black text-orange-500">{avgScore}</p>
                <p className="text-xs text-gray-400">Avg Score</p>
              </div>
              {Object.entries(badgeCounts)
                .filter(([b]) => b !== 'none' && BADGE_COLORS[b])
                .map(([badge, count]) => (
                  <div key={badge}>
                    <p className="text-2xl font-black" style={{ color: BADGE_COLORS[badge].color }}>
                      {BADGE_COLORS[badge].emoji} {count}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{badge}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-black text-gray-900 mb-4">Skills</h2>
      {skillList.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No skills submitted yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 stagger">
          {skillList.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  )
}
