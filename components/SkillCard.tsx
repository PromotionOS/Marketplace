import Link from 'next/link'
import type { Skill } from '@/lib/types'

const BADGE_STYLES: Record<string, string> = {
  none: 'bg-gray-100 text-gray-500',
  beginner: 'bg-blue-100 text-blue-700',
  proficient: 'bg-purple-100 text-purple-700',
  expert: 'bg-yellow-100 text-yellow-700',
}

const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  proficient: 'bg-blue-100 text-blue-700',
  expert: 'bg-red-100 text-red-700',
}

const CATEGORY_COLORS: Record<string, string> = {
  Backend: 'border-l-sky-500',
  Frontend: 'border-l-rose-500',
  DevOps: 'border-l-amber-500',
  Data: 'border-l-emerald-500',
  default: 'border-l-gray-300',
}

interface Props {
  skill: Skill
  endorsementCount?: number
}

export default function SkillCard({ skill, endorsementCount = 0 }: Props) {
  const borderColor = CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS.default
  const badgeStyle = BADGE_STYLES[skill.badge] ?? BADGE_STYLES.none

  return (
    <Link
      href={`/skills/${skill.id}`}
      className={`block bg-white rounded-xl border border-orange-100 border-l-4 ${borderColor} p-4 card-hover elevation-1 animate-fade-up`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{skill.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{skill.category}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${LEVEL_STYLES[skill.level]}`}>
            {skill.level}
          </span>
          {skill.badge !== 'none' && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${badgeStyle}`}>
              {skill.badge}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Score</span>
          <span className="text-xs font-semibold text-gray-700">{skill.score}/100</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-400 rounded-full"
            style={{ width: `${skill.score}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>{endorsementCount} endorsement{endorsementCount !== 1 ? 's' : ''}</span>
        <span>{skill.evidence_urls.length} evidence link{skill.evidence_urls.length !== 1 ? 's' : ''}</span>
        {skill.tags.length > 0 && (
          <span className="truncate">{skill.tags.slice(0, 3).join(', ')}</span>
        )}
      </div>
    </Link>
  )
}
