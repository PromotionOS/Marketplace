import type { Skill } from '@/lib/types'

interface CriterionProps {
  label: string
  description: string
  earned: number
  max: number
  color?: string
}

function Criterion({ label, description, earned, max, color = '#f97316' }: CriterionProps) {
  const pct = max > 0 ? (earned / max) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <span className="text-sm font-black ml-3 shrink-0" style={{ color }}>
          {earned}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
        />
      </div>
    </div>
  )
}

interface Props {
  skill: Skill
  endorsementCount: number
  evidencePoints?: number
}

export default function ScoreBreakdown({ skill, endorsementCount, evidencePoints = 0 }: Props) {
  const proficiencyPts =
    skill.proficiency_anchor === 'architect_and_mentor' ? 30
    : skill.proficiency_anchor === 'build_independently' ? 20
    : skill.proficiency_anchor === 'follow_tutorials' ? 10
    : skill.level === 'expert' ? 25
    : skill.level === 'proficient' ? 15
    : 8

  const cappedEvidence = Math.min(evidencePoints, 35)

  const endorsePts =
    endorsementCount >= 5 ? 25
    : endorsementCount >= 3 ? 20
    : endorsementCount >= 2 ? 15
    : endorsementCount >= 1 ? 8
    : 0

  const contextPts =
    !skill.context || skill.context.length === 0 ? 0
    : skill.context.length >= 50 ? 10
    : 5

  const PROFICIENCY_LABEL: Record<string, string> = {
    architect_and_mentor: '🔥 Architect & Mentor',
    build_independently:  '⚡ Builds Independently',
    follow_tutorials:     '🌱 Following Tutorials',
  }

  return (
    <div className="bg-white rounded-2xl elevation-1 p-5">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Score Breakdown</h2>

      <div className="space-y-5">
        <Criterion
          label="Proficiency Level"
          description={skill.proficiency_anchor ? PROFICIENCY_LABEL[skill.proficiency_anchor] : `Self-assessed: ${skill.level}`}
          earned={proficiencyPts}
          max={30}
          color="#f97316"
        />
        <Criterion
          label="Evidence Quality"
          description="Typed links — PRs, certs, shipped products"
          earned={cappedEvidence}
          max={35}
          color="#0ea5e9"
        />
        <Criterion
          label="Endorsements"
          description={`${endorsementCount} peer${endorsementCount !== 1 ? 's' : ''} verified this skill`}
          earned={endorsePts}
          max={25}
          color="#10b981"
        />
        <Criterion
          label="Context"
          description="What you've built with it"
          earned={contextPts}
          max={10}
          color="#7c3aed"
        />
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">Total Score</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-orange-500">{skill.score}</span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
      </div>
    </div>
  )
}
