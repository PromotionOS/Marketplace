'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseClient } from '@/lib/supabase'
import type { EvidenceType, ProficiencyAnchor } from '@/lib/types'

interface EvidenceItem {
  url: string
  evidence_type: EvidenceType
  title: string
}

interface SubmitSkillInput {
  name: string
  category: string
  taxonomy_id: string | null
  proficiency_anchor: ProficiencyAnchor
  context: string
  evidence: EvidenceItem[]
  tags: string[]
  is_primary: boolean
  available_to_mentor: boolean
}

export async function submitSkill(input: SubmitSkillInput): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const supabase = await createSupabaseClient()

  const levelMap: Record<ProficiencyAnchor, string> = {
    follow_tutorials:     'beginner',
    build_independently:  'proficient',
    architect_and_mentor: 'expert',
  }

  const { data: skill, error: skillError } = await supabase
    .from('skills')
    .insert({
      name:                input.name,
      category:            input.category,
      taxonomy_id:         input.taxonomy_id,
      level:               levelMap[input.proficiency_anchor],
      proficiency_anchor:  input.proficiency_anchor,
      context:             input.context,
      description:         input.context,  // populate required description field from context
      tags:                input.tags,
      is_primary:          input.is_primary,
      available_to_mentor: input.available_to_mentor,
      submitted_by:        userId,
      evidence_urls:       [],
    })
    .select('id')
    .single()

  if (skillError) {
    if (skillError.code === '23505') return { error: 'You already have a skill with this name.' }
    return { error: skillError.message }
  }

  const validEvidence = input.evidence.filter((e) => e.url.trim().length > 0)
  if (validEvidence.length > 0) {
    await supabase.from('skill_evidence').insert(
      validEvidence.map((e) => ({
        skill_id:      skill.id,
        url:           e.url.trim(),
        evidence_type: e.evidence_type,
        title:         e.title.trim() || null,
      }))
    )
  }

  revalidatePath('/skills')
  return {}
}

export async function endorseSkill(skillId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createSupabaseClient()
  const { error } = await supabase.from('endorsements').insert({
    skill_id: skillId,
    endorsed_by: userId,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/skills/${skillId}`)
}

export async function approveEdge(edgeId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createSupabaseClient()
  const { error } = await supabase
    .from('skill_edges')
    .update({ approved: true })
    .eq('id', edgeId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/edges')
  revalidatePath('/graph')
}

export async function rejectEdge(edgeId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createSupabaseClient()
  const { error } = await supabase.from('skill_edges').delete().eq('id', edgeId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/edges')
}
