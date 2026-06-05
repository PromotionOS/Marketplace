import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseClient } from '@/lib/supabase'
import ScoreBreakdown from '@/components/ScoreBreakdown'
import EndorseButton from '@/components/EndorseButton'
import Link from 'next/link'
import type { Profile, Skill } from '@/lib/types'

const CATEGORY_META: Record<string, { bg: string; emoji: string }> = {
  Backend:  { bg: '#e0f2fe', emoji: '⚙️' },
  Frontend: { bg: '#ffe4e6', emoji: '🎨' },
  DevOps:   { bg: '#fef3c7', emoji: '🚀' },
  Data:     { bg: '#d1fae5', emoji: '📊' },
  default:  { bg: '#f3f4f6', emoji: '💡' },
}

const BADGE_META: Record<string, { label: string; color: string; bg: string }> = {
  none:       { label: '',           color: '',        bg: '' },
  beginner:   { label: 'Beginner',   color: '#0369a1', bg: '#e0f2fe' },
  proficient: { label: 'Proficient', color: '#7c3aed', bg: '#ede9fe' },
  expert:     { label: '🏆 Expert',  color: '#b45309', bg: '#fef3c7' },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function SkillDetailPage({ params }: Props) {
  const { id } = await params
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: skill } = await supabase.from('skills').select('*').eq('id', id).single()
  if (!skill) notFound()

  const [{ data: endorsements }, { data: submitter }, { data: evidenceData }] = await Promise.all([
    supabase.from('endorsements').select('*, profiles:endorsed_by(id, full_name, avatar_url)').eq('skill_id', skill.id),
    supabase.from('profiles').select('id, full_name, avatar_url, team').eq('id', skill.submitted_by).single(),
    supabase.from('skill_evidence').select('evidence_type, evidence_type_weights!inner(points)').eq('skill_id', id),
  ])

  const { data: otherHolders } = await supabase
    .from('skills')
    .select('submitted_by, score, level, profiles:submitted_by(id, full_name, avatar_url, team)')
    .eq('name', skill.name)
    .neq('submitted_by', skill.submitted_by)
    .order('score', { ascending: false })
    .limit(8)

  const evidencePoints = (evidenceData ?? []).reduce((sum: number, e: { evidence_type_weights: { points: number }[] | { points: number } | null }) => {
    const w = e.evidence_type_weights
    const pts = Array.isArray(w) ? (w[0]?.points ?? 0) : (w?.points ?? 0)
    return sum + pts
  }, 0)

  type EndorsementWithProfile = { id: string; profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }
  const endorserProfiles = ((endorsements ?? []) as EndorsementWithProfile[]).map((e) => e.profiles)
  const hasEndorsed = endorserProfiles.some((p) => p.id === userId)
  const isOwner = skill.submitted_by === userId

  const cat = CATEGORY_META[skill.category] ?? CATEGORY_META.default
  const badge = BADGE_META[(skill as Skill).badge]

  return (
    <div className="max-w-4xl">
      <Link href="/skills" className="text-sm text-gray-400 hover:text-orange-500 transition-colors mb-6 inline-block">
        ← Back to Skills
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl elevation-2 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: cat.bg }}>
            {cat.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{skill.name}</h1>
                <p className="text-sm text-gray-400 mt-1">
                  {skill.category} · <span className="capitalize">{skill.level}</span>
                  {submitter && (
                    <> · <Link href={`/profile/${(submitter as Pick<Profile, 'id' | 'full_name'>).id}`} className="text-orange-500 hover:underline">
                      {(submitter as Pick<Profile, 'id' | 'full_name'>).full_name ?? 'Unknown'}
                    </Link></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isOwner && (
                  <Link
                    href={`/skills/${skill.id}/edit`}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors font-medium"
                  >
                    Edit
                  </Link>
                )}
                <div className="text-center">
                  <p className="text-2xl font-black text-orange-500">{(skill as Skill).score}</p>
                  <p className="text-xs text-gray-400">score</p>
                </div>
                {(skill as Skill).badge !== 'none' && badge.label && (
                  <span className="text-sm px-3 py-1.5 rounded-xl font-bold" style={{ color: badge.color, background: badge.bg }}>
                    {badge.label}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <EndorseButton skillId={skill.id} isOwner={isOwner} endorsers={endorserProfiles} hasEndorsed={hasEndorsed} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl elevation-1 p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{skill.description}</p>
            {(skill as Skill).tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {(skill as Skill).tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {(skill as Skill).evidence_urls.length > 0 && (
            <div className="bg-white rounded-2xl elevation-1 p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Evidence</h2>
              <ul className="space-y-2">
                {(skill as Skill).evidence_urls.map((url: string) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-orange-500 hover:text-orange-600 hover:underline break-all flex items-center gap-2">
                      <span>🔗</span> {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {otherHolders && otherHolders.length > 0 && (() => {
            type HolderProfile = { id: string; full_name: string | null; avatar_url: string | null; team: string | null }
            type Holder = { submitted_by: string; score: number; level: string; profiles: HolderProfile }
            const holders = otherHolders as unknown as Holder[]
            return (
              <div className="bg-white rounded-2xl elevation-1 p-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Others with this skill ({holders.length})
                </h2>
                <div className="space-y-2">
                  {holders.map((holder) => (
                    <Link key={holder.submitted_by} href={`/profile/${holder.profiles.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors">
                      {holder.profiles.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={holder.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-500">
                            {(holder.profiles.full_name ?? '?')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{holder.profiles.full_name ?? 'Unknown'}</p>
                        {holder.profiles.team && <p className="text-xs text-gray-400">{holder.profiles.team}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-orange-500">{holder.score}/100</p>
                        <p className="text-xs text-gray-400 capitalize">{holder.level}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

        <div>
          <ScoreBreakdown skill={skill as Skill} endorsementCount={endorserProfiles.length} evidencePoints={evidencePoints} />
        </div>
      </div>
    </div>
  )
}
