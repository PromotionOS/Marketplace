'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase-browser'
import SkillCard from '@/components/SkillCard'
import type { Skill } from '@/lib/types'

interface Props {
  initialSkills: Skill[]
  initialEndorsementCounts: Record<string, number>
}

export default function RealtimeSkillList({ initialSkills, initialEndorsementCounts }: Props) {
  const [skills, setSkills] = useState(initialSkills)
  const [endorsementCounts, setEndorsementCounts] = useState(initialEndorsementCounts)

  useEffect(() => {
    const supabase = getBrowserClient()

    const skillsSub = supabase
      .channel('skills-listing')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'skills' }, (payload) => {
        setSkills((prev) => [payload.new as Skill, ...prev])
      })
      .subscribe()

    const endorseSub = supabase
      .channel('endorsements-listing')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'endorsements' }, (payload) => {
        const skillId = (payload.new as { skill_id: string }).skill_id
        setEndorsementCounts((prev) => ({ ...prev, [skillId]: (prev[skillId] ?? 0) + 1 }))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(skillsSub)
      supabase.removeChannel(endorseSub)
    }
  }, [])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} endorsementCount={endorsementCounts[skill.id] ?? 0} />
      ))}
    </div>
  )
}
