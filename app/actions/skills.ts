'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function submitSkill(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const tags = ((formData.get('tags') as string) ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const evidenceUrls = ((formData.get('evidence_urls') as string) ?? '')
    .split('\n')
    .map((u) => u.trim())
    .filter(Boolean)

  const supabase = await createSupabaseClient()
  const { error } = await supabase.from('skills').insert({
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    level: formData.get('level') as string,
    tags,
    evidence_urls: evidenceUrls,
    years_experience: formData.get('years_experience')
      ? parseFloat(formData.get('years_experience') as string)
      : null,
    last_used_year: formData.get('last_used_year')
      ? parseInt(formData.get('last_used_year') as string, 10)
      : null,
    submitted_by: userId,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/skills')
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

