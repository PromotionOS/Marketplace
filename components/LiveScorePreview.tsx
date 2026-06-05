'use client'

import type { Badge } from '@/lib/types'

interface Props {
  description: string
  evidenceCount: number
  yearsExperience: number | null
  lastUsedYear: number | null
  endorsementCount?: number
}

const BADGE_CONFIG: Record<Badge, { label: string; color: string; bg: string }> = {
  none:       { label: 'No Badge Yet', color: '#78716c', bg: '#f5f5f4' },
  beginner:   { label: 'Beginner',     color: '#0369a1', bg: '#e0f2fe' },
  proficient: { label: 'Proficient',   color: '#7c3aed', bg: '#ede9fe' },
  expert:     { label: 'Expert',       color: '#b45309', bg: '#fef3c7' },
}

function computeScore(props: Props): { score: number; badge: Badge; criteria: Record<string, { earned: number; max: number }> } {
  const currentYear = new Date().getFullYear()

  const descPts =
    props.description.length > 150 ? 20
    : props.description.length >= 50 ? 10
    : 0

  const evidencePts =
    props.evidenceCount >= 3 ? 25
    : props.evidenceCount === 2 ? 18
    : props.evidenceCount === 1 ? 10
    : 0

  const yearsPts =
    (props.yearsExperience ?? 0) >= 5 ? 15
    : (props.yearsExperience ?? 0) >= 3 ? 10
    : (props.yearsExperience ?? 0) >= 1 ? 5
    : 0

  const recencyPts = (() => {
    if (!props.lastUsedYear) return 0
    const diff = currentYear - props.lastUsedYear
    if (diff <= 1) return 15
    if (diff <= 2) return 10
    if (diff <= 3) return 5
    return 0
  })()

  const endorsePts =
    (props.endorsementCount ?? 0) >= 3 ? 25
    : (props.endorsementCount ?? 0) === 2 ? 18
    : (props.endorsementCount ?? 0) === 1 ? 10
    : 0

  const score = descPts + evidencePts + yearsPts + recencyPts + endorsePts

  const badge: Badge =
    score >= 85 ? 'expert'
    : score >= 70 ? 'proficient'
    : score >= 50 ? 'beginner'
    : 'none'

  return {
    score,
    badge,
    criteria: {
      'Description':   { earned: descPts,    max: 20 },
      'Evidence':      { earned: evidencePts, max: 25 },
      'Experience':    { earned: yearsPts,    max: 15 },
      'Recency':       { earned: recencyPts,  max: 15 },
      'Endorsements':  { earned: endorsePts,  max: 25 },
    },
  }
}

export default function LiveScorePreview(props: Props) {
  const { score, badge, criteria } = computeScore(props)
  const badgeConf = BADGE_CONFIG[badge]
  const pct = score

  return (
    <div className="bg-white rounded-2xl elevation-2 p-5 sticky top-24">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Live Score</p>

      {/* Circular score */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#fed7aa" strokeWidth="8" />
            <circle
              cx="48" cy="48" r="40" fill="none"
              stroke="#f97316" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-gray-900">{score}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
        </div>
        <span
          className="mt-3 text-xs font-bold px-3 py-1 rounded-full"
          style={{ color: badgeConf.color, background: badgeConf.bg }}
        >
          {badgeConf.label}
        </span>
      </div>

      {/* Criteria bars */}
      <div className="space-y-3">
        {Object.entries(criteria).map(([label, { earned, max }]) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-700">{earned}/{max}</span>
            </div>
            <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full"
                style={{ width: `${(earned / max) * 100}%`, transition: 'width 0.3s ease' }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Updates as you fill in the form
      </p>
    </div>
  )
}
