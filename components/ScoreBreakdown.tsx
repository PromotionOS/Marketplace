import type { Skill } from '@/lib/types'

interface CriterionProps {
  label: string
  earned: number
  max: number
}

function Criterion({ label, earned, max }: CriterionProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-40 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full"
          style={{ width: `${(earned / max) * 100}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-16 text-right">
        {earned}/{max}
      </span>
    </div>
  )
}

interface Props {
  skill: Skill
  endorsementCount: number
}

export default function ScoreBreakdown({ skill, endorsementCount }: Props) {
  const currentYear = new Date().getFullYear()

  const descPts =
    skill.description.length > 150 ? 20
    : skill.description.length >= 50 ? 10
    : 0

  const evidencePts =
    skill.evidence_urls.length >= 3 ? 25
    : skill.evidence_urls.length === 2 ? 18
    : skill.evidence_urls.length === 1 ? 10
    : 0

  const yearsPts =
    (skill.years_experience ?? 0) >= 5 ? 15
    : (skill.years_experience ?? 0) >= 3 ? 10
    : (skill.years_experience ?? 0) >= 1 ? 5
    : 0

  const recencyPts = (() => {
    if (!skill.last_used_year) return 0
    const diff = currentYear - skill.last_used_year
    if (diff <= 1) return 15
    if (diff <= 2) return 10
    if (diff <= 3) return 5
    return 0
  })()

  const endorsePts =
    endorsementCount >= 3 ? 25
    : endorsementCount === 2 ? 18
    : endorsementCount === 1 ? 10
    : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Score Breakdown</h2>
      <div className="space-y-3">
        <Criterion label="Description quality" earned={descPts} max={20} />
        <Criterion label="Evidence links" earned={evidencePts} max={25} />
        <Criterion label="Years of experience" earned={yearsPts} max={15} />
        <Criterion label="Recency" earned={recencyPts} max={15} />
        <Criterion label="Endorsements" earned={endorsePts} max={25} />
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Total</span>
        <span className="text-lg font-bold text-indigo-600">{skill.score}/100</span>
      </div>
    </div>
  )
}
