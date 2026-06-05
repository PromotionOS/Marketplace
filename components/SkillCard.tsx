import Link from 'next/link'
import type { Skill } from '@/lib/types'

const CATEGORY_META: Record<string, { color: string; border: string; bg: string; emoji: string }> = {
  Backend:  { color: '#0ea5e9', border: 'border-l-sky-500',     bg: '#e0f2fe', emoji: '⚙️' },
  Frontend: { color: '#f43f5e', border: 'border-l-rose-500',    bg: '#ffe4e6', emoji: '🎨' },
  DevOps:   { color: '#f59e0b', border: 'border-l-amber-500',   bg: '#fef3c7', emoji: '🚀' },
  Data:     { color: '#10b981', border: 'border-l-emerald-500', bg: '#d1fae5', emoji: '📊' },
  default:  { color: '#9ca3af', border: 'border-l-gray-300',    bg: '#f3f4f6', emoji: '💡' },
}

const BADGE_META: Record<string, { label: string; color: string; bg: string }> = {
  none:       { label: '',           color: '',        bg: '' },
  beginner:   { label: 'Beginner',   color: '#0369a1', bg: '#e0f2fe' },
  proficient: { label: 'Proficient', color: '#7c3aed', bg: '#ede9fe' },
  expert:     { label: '🏆 Expert',  color: '#b45309', bg: '#fef3c7' },
}

const LEVEL_META: Record<string, { color: string; bg: string }> = {
  beginner:   { color: '#15803d', bg: '#dcfce7' },
  proficient: { color: '#6d28d9', bg: '#ede9fe' },
  expert:     { color: '#c2410c', bg: '#ffedd5' },
}

interface Props {
  skill: Skill
  endorsementCount?: number
}

export default function SkillCard({ skill, endorsementCount = 0 }: Props) {
  const cat = CATEGORY_META[skill.category] ?? CATEGORY_META.default
  const badge = BADGE_META[skill.badge]
  const level = LEVEL_META[skill.level] ?? LEVEL_META.beginner

  return (
    <Link
      href={`/skills/${skill.id}`}
      className={`block bg-white rounded-2xl border border-orange-100 border-l-4 ${cat.border} p-5 card-hover elevation-1 animate-fade-up`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: cat.bg }}
          >
            {cat.emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate leading-tight">{skill.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{skill.category}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
            style={{ color: level.color, background: level.bg }}
          >
            {skill.level}
          </span>
          {skill.badge !== 'none' && badge.label && (
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
              style={{ color: badge.color, background: badge.bg }}
            >
              {badge.label}
            </span>
          )}
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Score</span>
          <span className="text-xs font-black text-orange-500">{skill.score}/100</span>
        </div>
        <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${skill.score}%`,
              background: `linear-gradient(90deg, #f97316, #fbbf24)`,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>👍 {endorsementCount}</span>
          <span>🔗 {skill.evidence_urls.length}</span>
        </div>
        {skill.tags.length > 0 && (
          <div className="flex gap-1">
            {skill.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
