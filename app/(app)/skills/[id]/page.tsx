import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseClient } from '@/lib/supabase'
import ScoreBreakdown from '@/components/ScoreBreakdown'
import EndorseButton from '@/components/EndorseButton'
import Link from 'next/link'
import type { Profile, Skill } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SkillDetailPage({ params }: Props) {
  const { id } = await params
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: skill } = await supabase
    .from('skills')
    .select('*')
    .eq('id', id)
    .single()

  if (!skill) notFound()

  const [{ data: endorsements }, { data: submitter }] = await Promise.all([
    supabase
      .from('endorsements')
      .select('*, profiles:endorsed_by(id, full_name, avatar_url)')
      .eq('skill_id', skill.id),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, team')
      .eq('id', skill.submitted_by)
      .single(),
  ])

  type EndorsementWithProfile = {
    id: string
    profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  }

  const endorserProfiles = ((endorsements ?? []) as EndorsementWithProfile[]).map((e) => e.profiles)
  const hasEndorsed = endorserProfiles.some((p) => p.id === userId)
  const isOwner = skill.submitted_by === userId

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{skill.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {skill.category} ·{' '}
            <span className="capitalize">{skill.level}</span>
            {submitter && (
              <>
                {' · '}
                <Link href={`/profile/${(submitter as Pick<Profile, 'id' | 'full_name'>).id}`} className="hover:text-indigo-600">
                  {(submitter as Pick<Profile, 'id' | 'full_name'>).full_name ?? 'Unknown'}
                </Link>
              </>
            )}
          </p>
        </div>
        {(skill as Skill).badge !== 'none' && (
          <span className="text-sm px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full capitalize font-medium">
            {(skill as Skill).badge}
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <p className="text-gray-700 whitespace-pre-wrap">{skill.description}</p>
        {(skill as Skill).tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {(skill as Skill).tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        {(skill as Skill).evidence_urls.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evidence</p>
            <ul className="space-y-1">
              {(skill as Skill).evidence_urls.map((url: string) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline break-all"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mb-6">
        <EndorseButton
          skillId={skill.id}
          isOwner={isOwner}
          endorsers={endorserProfiles}
          hasEndorsed={hasEndorsed}
        />
      </div>

      <ScoreBreakdown skill={skill as Skill} endorsementCount={endorserProfiles.length} />
    </div>
  )
}
