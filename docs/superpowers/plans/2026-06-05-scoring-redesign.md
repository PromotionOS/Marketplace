# Scoring Engine Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace character-count scoring with meaningful criteria: typed evidence weights, proficiency anchor levels, endorsement scaling, and remove self-reported years/last-used from scoring.

**Architecture:** New Supabase migration (009) rewrites `compute_skill_score` function. Updated `ScoreBreakdown` component shows new criteria. `LiveScorePreview` updated to match. Depends on Sub-Projects 1 and 2.

**Tech Stack:** PostgreSQL plpgsql, Next.js 16, TypeScript

---

## Task 1: Migration 009 — New scoring function

Create `supabase/migrations/009_new_scoring.sql`:

New scoring breakdown (total 100 pts):

| Criterion | Max | Logic |
|---|---|---|
| Proficiency anchor | 30 | follow_tutorials=10, build_independently=20, architect_and_mentor=30 |
| Typed evidence | 35 | Sum of evidence_type_weights, capped at 35 |
| Endorsements | 25 | 0=0, 1=8, 2=15, 3=20, 5+=25 (scales further) |
| Context quality | 10 | context is null=0, <50 chars=5, 50+ chars=10 |

Badge thresholds stay the same (50=beginner, 70=proficient, 85=expert).

```sql
create or replace function public.compute_skill_score(skill_id uuid)
returns int language plpgsql security definer as $$
declare
  s                   public.skills%rowtype;
  endorsement_count   int;
  evidence_pts        int := 0;
  proficiency_pts     int := 0;
  endorsement_pts     int := 0;
  context_pts         int := 0;
  total               int := 0;
  badge_val           text;
begin
  select * into s from public.skills where id = skill_id;
  select count(*) into endorsement_count from public.endorsements where skill_id = s.id;

  -- Proficiency anchor (30 pts max)
  proficiency_pts := case s.proficiency_anchor
    when 'architect_and_mentor'  then 30
    when 'build_independently'   then 20
    when 'follow_tutorials'      then 10
    -- fallback: map old level field for backwards compat
    else case s.level
      when 'expert'     then 25
      when 'proficient' then 15
      when 'beginner'   then 8
      else 0
    end
  end;

  -- Typed evidence (35 pts max) — sum weights from evidence_type_weights table
  select coalesce(sum(w.points), 0)
  into evidence_pts
  from public.skill_evidence se
  join public.evidence_type_weights w on w.evidence_type = se.evidence_type
  where se.skill_id = s.id
    and se.url is not null
    and se.url != '';

  -- cap at 35
  evidence_pts := least(evidence_pts, 35);

  -- Endorsements (25 pts max) — scales to 5+
  endorsement_pts := case
    when endorsement_count >= 5 then 25
    when endorsement_count >= 3 then 20
    when endorsement_count >= 2 then 15
    when endorsement_count >= 1 then 8
    else 0
  end;

  -- Context quality (10 pts max)
  context_pts := case
    when s.context is null or length(s.context) = 0 then 0
    when length(s.context) >= 50 then 10
    else 5
  end;

  total := proficiency_pts + evidence_pts + endorsement_pts + context_pts;

  badge_val := case
    when total >= 85 then 'expert'
    when total >= 70 then 'proficient'
    when total >= 50 then 'beginner'
    else 'none'
  end;

  set local session_replication_role = replica;
  update public.skills set score = total, badge = badge_val, updated_at = now() where id = skill_id;
  set local session_replication_role = default;

  return total;
end;
$$;

-- Recompute all existing skill scores with new function
do $$
declare
  r record;
begin
  for r in select id from public.skills loop
    perform public.compute_skill_score(r.id);
  end loop;
end;
$$;
```

---

## Task 2: Update ScoreBreakdown component

Replace `components/ScoreBreakdown.tsx` with new criteria:

```tsx
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
```

---

## Task 3: Update LiveScorePreview for new scoring

Update `components/LiveScorePreview.tsx` props and compute function:

```tsx
'use client'

import type { Badge, ProficiencyAnchor } from '@/lib/types'

interface Props {
  proficiencyAnchor: ProficiencyAnchor | null
  evidencePoints: number
  endorsementCount?: number
  context: string
}

const BADGE_CONFIG: Record<Badge, { label: string; color: string; bg: string }> = {
  none:       { label: 'No Badge Yet', color: '#78716c', bg: '#f5f5f4' },
  beginner:   { label: 'Beginner',     color: '#0369a1', bg: '#e0f2fe' },
  proficient: { label: 'Proficient',   color: '#7c3aed', bg: '#ede9fe' },
  expert:     { label: 'Expert 🏆',    color: '#b45309', bg: '#fef3c7' },
}

function computeScore(props: Props) {
  const proficiencyPts =
    props.proficiencyAnchor === 'architect_and_mentor' ? 30
    : props.proficiencyAnchor === 'build_independently' ? 20
    : props.proficiencyAnchor === 'follow_tutorials' ? 10
    : 0

  const evidencePts = Math.min(props.evidencePoints, 35)

  const endorsePts =
    (props.endorsementCount ?? 0) >= 5 ? 25
    : (props.endorsementCount ?? 0) >= 3 ? 20
    : (props.endorsementCount ?? 0) >= 2 ? 15
    : (props.endorsementCount ?? 0) >= 1 ? 8
    : 0

  const contextPts =
    !props.context || props.context.length === 0 ? 0
    : props.context.length >= 50 ? 10
    : 5

  const score = proficiencyPts + evidencePts + endorsePts + contextPts

  const badge: Badge =
    score >= 85 ? 'expert'
    : score >= 70 ? 'proficient'
    : score >= 50 ? 'beginner'
    : 'none'

  return {
    score,
    badge,
    criteria: {
      'Proficiency': { earned: proficiencyPts, max: 30 },
      'Evidence':    { earned: evidencePts,    max: 35 },
      'Endorsements':{ earned: endorsePts,     max: 25 },
      'Context':     { earned: contextPts,     max: 10 },
    },
  }
}

export default function LiveScorePreview(props: Props) {
  const { score, badge, criteria } = computeScore(props)
  const badgeConf = BADGE_CONFIG[badge]

  return (
    <div className="bg-white rounded-2xl elevation-2 p-5 sticky top-24">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Live Score</p>

      <div className="flex flex-col items-center mb-5">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#fed7aa" strokeWidth="8" />
            <circle
              cx="48" cy="48" r="40" fill="none"
              stroke="#f97316" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-gray-900">{score}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
        </div>
        <span className="mt-3 text-xs font-bold px-3 py-1 rounded-full"
          style={{ color: badgeConf.color, background: badgeConf.bg }}>
          {badgeConf.label}
        </span>
      </div>

      <div className="space-y-3">
        {Object.entries(criteria).map(([label, { earned, max }]) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-700">{earned}/{max}</span>
            </div>
            <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full"
                style={{ width: `${(earned / max) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">Updates as you fill in the form</p>
    </div>
  )
}
```

---

## Commit

```bash
git add supabase/migrations/009_new_scoring.sql
git add components/ScoreBreakdown.tsx components/LiveScorePreview.tsx
git commit -m "feat: new scoring engine — proficiency anchors, typed evidence weights, context quality"
git push
```
