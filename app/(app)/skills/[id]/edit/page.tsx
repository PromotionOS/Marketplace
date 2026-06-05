import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseClient } from '@/lib/supabase'
import SkillForm from '@/components/SkillForm'
import Link from 'next/link'
import type { Skill, SkillEvidence } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSkillPage({ params }: Props) {
  const { id } = await params
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: skill } = await supabase
    .from('skills')
    .select('*')
    .eq('id', id)
    .single()

  if (!skill) notFound()
  if (skill.submitted_by !== userId) redirect(`/skills/${id}`)

  const { data: evidence } = await supabase
    .from('skill_evidence')
    .select('*')
    .eq('skill_id', id)

  const s = skill as Skill
  const ev = (evidence as SkillEvidence[]) ?? []

  return (
    <div>
      <div className="mb-8">
        <Link href={`/skills/${id}`} className="text-sm text-gray-400 hover:text-orange-500 transition-colors">
          ← Back to skill
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-2">Edit Skill</h1>
        <p className="text-gray-400 text-sm mt-1">Update your skill details and evidence</p>
      </div>
      <SkillForm
        initialValues={{
          skillId: s.id,
          skillName: s.name,
          taxonomyId: s.taxonomy_id ?? null,
          category: s.category as 'Backend' | 'Frontend' | 'DevOps' | 'Data' | 'Mobile' | 'Security' | 'AI/ML' | 'Other',
          proficiencyAnchor: s.proficiency_anchor ?? null,
          context: s.context ?? '',
          evidence: ev.map((e) => ({
            url: e.url,
            evidence_type: e.evidence_type,
            title: e.title ?? '',
          })),
          tags: s.tags.join(', '),
          isPrimary: s.is_primary ?? false,
          availableToMentor: s.available_to_mentor ?? false,
        }}
      />
    </div>
  )
}
