'use client'

import type { ProficiencyAnchor } from '@/lib/types'

interface Props {
  skillName: string
  category: string
  proficiencyAnchor: ProficiencyAnchor | null
  evidencePoints: number
  context: string
  isPrimary: boolean
}

const PROFICIENCY_SCORE: Record<string, number> = {
  follow_tutorials:     20,
  build_independently:  40,
  architect_and_mentor: 60,
}

const BADGE_CONFIG = {
  expert:     { label: 'Expert 🏆',    color: '#b45309', bg: '#fef3c7' },
  proficient: { label: 'Proficient ⚡', color: '#7c3aed', bg: '#ede9fe' },
  beginner:   { label: 'Beginner 🌱',  color: '#0369a1', bg: '#e0f2fe' },
  none:       { label: 'No badge yet', color: '#78716c', bg: '#f5f5f4' },
}

export default function LiveScorePreview({
  skillName,
  category,
  proficiencyAnchor,
  evidencePoints,
  context,
  isPrimary,
}: Props) {
  const proficiencyScore = proficiencyAnchor ? (PROFICIENCY_SCORE[proficiencyAnchor] ?? 0) : 0
  const contextScore = context.trim().length >= 50 ? 15 : Math.round((context.trim().length / 50) * 15)
  const primaryBonus = isPrimary ? 10 : 0
  const total = Math.min(proficiencyScore + evidencePoints + contextScore + primaryBonus, 100)

  const badgeKey = total >= 80 ? 'expert' : total >= 50 ? 'proficient' : total >= 20 ? 'beginner' : 'none'
  const badge = BADGE_CONFIG[badgeKey]

  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference * (1 - total / 100)

  return (
    <div className="bg-white rounded-2xl elevation-2 p-6 space-y-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Score</p>

      {/* Score ring */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#fed7aa" strokeWidth="8" />
            <circle
              cx="48" cy="48" r="40" fill="none"
              stroke="#f97316" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-gray-900">{total}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ color: badge.color, background: badge.bg }}
        >
          {badge.label}
        </span>
        {skillName && (
          <p className="text-sm font-semibold text-gray-700 text-center">{skillName}</p>
        )}
        {!skillName && (
          <p className="text-xs text-gray-400 italic text-center">Start typing to see your score</p>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Breakdown</p>
        {[
          { label: 'Proficiency', value: proficiencyScore, max: 60 },
          { label: 'Evidence',    value: evidencePoints,   max: 50 },
          { label: 'Context',     value: contextScore,     max: 15 },
          { label: 'Primary',     value: primaryBonus,     max: 10 },
        ].map(({ label, value, max }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-700">{value}/{max}</span>
            </div>
            <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full"
                style={{ width: `${(value / max) * 100}%`, transition: 'width 0.3s ease' }}
              />
            </div>
          </div>
        ))}
      </div>

      {category && (
        <p className="text-xs text-gray-400 text-center">{category}</p>
      )}
    </div>
  )
}
