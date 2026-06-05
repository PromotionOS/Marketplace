import { notFound } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import SkillCard from '@/components/SkillCard'
import type { Skill, Profile } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .eq('submitted_by', id)
    .order('score', { ascending: false })

  const badgeCounts = ((skills as Skill[]) ?? []).reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s.badge]: (acc[s.badge] ?? 0) + 1 }),
    {}
  )

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        {(profile as Profile).avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(profile as Profile).avatar_url!}
            alt={(profile as Profile).full_name ?? ''}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-orange-600">
              {((profile as Profile).full_name ?? 'U')[0].toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {(profile as Profile).full_name ?? 'Unknown'}
          </h1>
          <p className="text-sm text-gray-500">
            {(profile as Profile).team ? `${(profile as Profile).team} · ` : ''}
            <span className="capitalize">{(profile as Profile).role}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        {Object.entries(badgeCounts)
          .filter(([badge]) => badge !== 'none')
          .map(([badge, count]) => (
            <div key={badge} className="text-center">
              <p className="text-2xl font-bold text-orange-600">{count}</p>
              <p className="text-xs text-gray-500 capitalize">{badge}</p>
            </div>
          ))}
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{skills?.length ?? 0}</p>
          <p className="text-xs text-gray-500">Total skills</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
      {skills?.length === 0 ? (
        <p className="text-gray-400">No skills submitted yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(skills as Skill[]).map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  )
}
