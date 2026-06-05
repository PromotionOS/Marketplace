# Skill Form Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current skill form with one that collects meaningful, verifiable data — taxonomy-based skill selection, proficiency anchors instead of years/last-used, typed evidence links, mentorship flag.

**Architecture:** New `SkillSearchInput` component for taxonomy search. Rewritten `SkillForm` with 4 clear sections. Updated `submitSkill` server action. Depends on Sub-Project 1 (taxonomy table must exist).

**Tech Stack:** Next.js 16, Supabase JS v2, Tailwind v4, Tiptap

**Dependency:** Foundation Schema plan (2026-06-05-foundation-schema.md) must be fully applied before starting this plan. The `skill_taxonomy` and `skill_evidence` tables must exist.

---

## Task 1: SkillSearchInput Component

Create `components/SkillSearchInput.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase-browser'
import type { SkillTaxonomy } from '@/lib/types'

interface Props {
  value: string
  taxonomyId: string | null
  onChange: (name: string, taxonomyId: string | null) => void
}

export default function SkillSearchInput({ value, taxonomyId, onChange }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SkillTaxonomy[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = getBrowserClient()
      const { data } = await supabase
        .from('skill_taxonomy')
        .select('*')
        .or(`name.ilike.%${query}%,aliases.cs.{${query}}`)
        .order('name')
        .limit(8)
      setResults((data as SkillTaxonomy[]) ?? [])
      setLoading(false)
      setOpen(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const CATEGORY_EMOJI: Record<string, string> = {
    Backend: '⚙️', Frontend: '🎨', DevOps: '🚀', Data: '📊',
    Mobile: '📱', Security: '🔒', 'AI/ML': '🤖', Other: '💡',
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value, null) }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search skills (e.g. React, Kubernetes, dbt...)"
          className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
        />
        {taxonomyId && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            ✓ Matched
          </span>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-100 elevation-3 overflow-hidden">
          {loading && <p className="px-4 py-3 text-sm text-gray-400">Searching...</p>}
          {results.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => { setQuery(skill.name); onChange(skill.name, skill.id); setOpen(false) }}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-center gap-3"
            >
              <span className="text-lg">{CATEGORY_EMOJI[skill.category] ?? '💡'}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{skill.name}</p>
                <p className="text-xs text-gray-400">{skill.category}{skill.subcategory ? ` · ${skill.subcategory}` : ''}</p>
              </div>
            </button>
          ))}
          {!loading && query.length >= 2 && (
            <button
              type="button"
              onClick={() => { onChange(query, null); setOpen(false) }}
              className="w-full text-left px-4 py-3 border-t border-gray-50 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              + Add &quot;{query}&quot; as a custom skill
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## Task 2: ProficiencySelect Component

Create `components/ProficiencySelect.tsx`:

```tsx
'use client'

import type { ProficiencyAnchor } from '@/lib/types'

const ANCHORS: { value: ProficiencyAnchor; emoji: string; title: string; description: string }[] = [
  {
    value: 'follow_tutorials',
    emoji: '🌱',
    title: 'Learning',
    description: 'Can follow tutorials and documentation. Need guidance on non-trivial problems.',
  },
  {
    value: 'build_independently',
    emoji: '⚡',
    title: 'Independent',
    description: 'Can build features and solve problems independently. Comfortable debugging.',
  },
  {
    value: 'architect_and_mentor',
    emoji: '🔥',
    title: 'Expert',
    description: 'Can architect systems, review others\' work, and mentor the team.',
  },
]

interface Props {
  value: ProficiencyAnchor | null
  onChange: (value: ProficiencyAnchor) => void
}

export default function ProficiencySelect({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ANCHORS.map((anchor) => (
        <button
          key={anchor.value}
          type="button"
          onClick={() => onChange(anchor.value)}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            value === anchor.value
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50'
          }`}
        >
          <span className="text-2xl block mb-2">{anchor.emoji}</span>
          <p className={`text-sm font-bold mb-1 ${value === anchor.value ? 'text-orange-600' : 'text-gray-900'}`}>
            {anchor.title}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">{anchor.description}</p>
        </button>
      ))}
    </div>
  )
}
```

---

## Task 3: EvidenceInput Component

Create `components/EvidenceInput.tsx`:

```tsx
'use client'

import type { EvidenceType } from '@/lib/types'
import CustomSelect from '@/components/CustomSelect'

const EVIDENCE_TYPE_OPTIONS = [
  { value: 'github_pr',       label: '🔀 GitHub PR' },
  { value: 'github_repo',     label: '📦 GitHub Repo' },
  { value: 'shipped_product', label: '🚀 Shipped Product' },
  { value: 'certificate',     label: '🎓 Certificate' },
  { value: 'article',         label: '✍️ Article / Blog' },
  { value: 'other',           label: '🔗 Other Link' },
]

const EVIDENCE_POINTS: Record<string, number> = {
  github_pr: 20, shipped_product: 18, certificate: 15,
  github_repo: 10, article: 8, other: 5,
}

interface EvidenceItem {
  url: string
  evidence_type: EvidenceType
  title: string
}

interface Props {
  items: EvidenceItem[]
  onChange: (items: EvidenceItem[]) => void
}

export default function EvidenceInput({ items, onChange }: Props) {
  function addItem() {
    onChange([...items, { url: '', evidence_type: 'github_pr', title: '' }])
  }

  function updateItem(index: number, field: keyof EvidenceItem, value: string) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  const totalPoints = items.reduce((sum, item) =>
    sum + (item.url ? (EVIDENCE_POINTS[item.evidence_type] ?? 5) : 0), 0
  )

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Link {i + 1}</span>
            <div className="flex items-center gap-2">
              {item.url && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                  +{EVIDENCE_POINTS[item.evidence_type]} pts
                </span>
              )}
              <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
            </div>
          </div>
          <CustomSelect
            value={item.evidence_type}
            onChange={(v) => updateItem(i, 'evidence_type', v as EvidenceType)}
            options={EVIDENCE_TYPE_OPTIONS}
            placeholder="Type"
          />
          <input
            value={item.url}
            onChange={(e) => updateItem(i, 'url', e.target.value)}
            placeholder="https://..."
            type="url"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
          <input
            value={item.title}
            onChange={(e) => updateItem(i, 'title', e.target.value)}
            placeholder="Short description (optional)"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="text-sm text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-1"
      >
        + Add evidence link
      </button>

      {items.length > 0 && (
        <p className="text-xs text-gray-400">
          Evidence score: <span className="font-semibold text-orange-500">{Math.min(totalPoints, 50)} pts</span>
          {totalPoints > 50 && ' (capped at 50)'}
        </p>
      )}
    </div>
  )
}
```

---

## Task 4: Rewrite SkillForm

Replace `components/SkillForm.tsx` with the following. The form has 4 clear sections using all three new components.

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SkillSearchInput from '@/components/SkillSearchInput'
import ProficiencySelect from '@/components/ProficiencySelect'
import EvidenceInput from '@/components/EvidenceInput'
import LiveScorePreview from '@/components/LiveScorePreview'
import { submitSkill } from '@/app/actions/skills'
import type { ProficiencyAnchor, EvidenceType } from '@/lib/types'

const CATEGORY_OPTIONS = ['Backend', 'Frontend', 'DevOps', 'Data', 'Mobile', 'Security', 'AI/ML', 'Other'] as const
type Category = typeof CATEGORY_OPTIONS[number]

interface EvidenceItem {
  url: string
  evidence_type: EvidenceType
  title: string
}

const EVIDENCE_POINTS: Record<string, number> = {
  github_pr: 20, shipped_product: 18, certificate: 15,
  github_repo: 10, article: 8, other: 5,
}

export default function SkillForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Section 1: Skill identity
  const [skillName, setSkillName] = useState('')
  const [taxonomyId, setTaxonomyId] = useState<string | null>(null)
  const [category, setCategory] = useState<Category>('Backend')

  // Section 2: Proficiency
  const [proficiencyAnchor, setProficiencyAnchor] = useState<ProficiencyAnchor | null>(null)

  // Section 3: Evidence
  const [context, setContext] = useState('')
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])

  // Section 4: Extra
  const [tags, setTags] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [availableToMentor, setAvailableToMentor] = useState(false)

  const evidencePoints = Math.min(
    evidence.reduce((sum, item) => sum + (item.url ? (EVIDENCE_POINTS[item.evidence_type] ?? 5) : 0), 0),
    50
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!skillName.trim()) { setError('Skill name is required'); return }
    if (!proficiencyAnchor) { setError('Please select your proficiency level'); return }
    if (context.trim().length < 50) { setError('Please describe what you built (at least 50 characters)'); return }

    setSubmitting(true)
    setError(null)

    const result = await submitSkill({
      name: skillName.trim(),
      category,
      taxonomy_id: taxonomyId,
      proficiency_anchor: proficiencyAnchor,
      context: context.trim(),
      evidence,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      is_primary: isPrimary,
      available_to_mentor: availableToMentor,
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      router.push('/skills')
      router.refresh()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 py-8">
      {/* Left: Form */}
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">

        {/* Section 1: What's the skill? */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">What&apos;s the skill?</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Skill name</label>
            <SkillSearchInput
              value={skillName}
              taxonomyId={taxonomyId}
              onChange={(name, tid) => { setSkillName(name); setTaxonomyId(tid) }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    category === cat
                      ? 'bg-orange-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: How good are you? */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">How good are you?</h2>
          <ProficiencySelect value={proficiencyAnchor} onChange={setProficiencyAnchor} />
        </div>

        {/* Section 3: What have you built? */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">What have you built?</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tell us what you&apos;ve built with this skill
              <span className="ml-1 text-xs text-gray-400 font-normal">(min 50 chars)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              placeholder="e.g. Built a real-time analytics dashboard processing 1M events/day using Kafka and PostgreSQL. Designed the schema and wrote all the backend services."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{context.length} / 50 min characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Evidence links</label>
            <EvidenceInput items={evidence} onChange={setEvidence} />
          </div>
        </div>

        {/* Section 4: Extra */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Extra (optional)</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="distributed-systems, streaming, real-time (comma separated)"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsPrimary(!isPrimary)}
                className={`w-11 h-6 rounded-full transition-colors relative ${isPrimary ? 'bg-orange-400' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPrimary ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Primary skill</p>
                <p className="text-xs text-gray-500">This is one of your top 3–5 skills</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setAvailableToMentor(!availableToMentor)}
                className={`w-11 h-6 rounded-full transition-colors relative ${availableToMentor ? 'bg-orange-400' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${availableToMentor ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Available to mentor</p>
                <p className="text-xs text-gray-500">Others can reach out to learn from you</p>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-orange-400 text-white font-bold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Add Skill'}
        </button>
      </form>

      {/* Right: Live Score Preview */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <LiveScorePreview
            skillName={skillName}
            category={category}
            proficiencyAnchor={proficiencyAnchor}
            evidencePoints={evidencePoints}
            context={context}
            isPrimary={isPrimary}
          />
        </div>
      </div>
    </div>
  )
}
```

---

## Task 5: Update submitSkill Server Action

Update `app/actions/skills.ts`. The `submitSkill` function must accept and persist the new fields, then insert typed evidence rows.

```ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/lib/supabase-server'
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

  const supabase = await getServerClient()

  // Map proficiency_anchor to level for backwards compat
  const levelMap: Record<ProficiencyAnchor, string> = {
    follow_tutorials:    'beginner',
    build_independently: 'proficient',
    architect_and_mentor:'expert',
  }

  const { data: skill, error: skillError } = await supabase
    .from('skills')
    .insert({
      name:               input.name,
      category:           input.category,
      taxonomy_id:        input.taxonomy_id,
      level:              levelMap[input.proficiency_anchor],
      proficiency_anchor: input.proficiency_anchor,
      context:            input.context,
      tags:               input.tags,
      is_primary:         input.is_primary,
      available_to_mentor:input.available_to_mentor,
      submitted_by:       userId,
      description:        '',       // required field, populated from context
      evidence_urls:      [],       // legacy field — kept empty, evidence in skill_evidence
    })
    .select('id')
    .single()

  if (skillError) {
    if (skillError.code === '23505') return { error: 'You already have a skill with this name.' }
    return { error: skillError.message }
  }

  // Insert typed evidence rows
  const validEvidence = input.evidence.filter((e) => e.url.trim().length > 0)
  if (validEvidence.length > 0) {
    const { error: evidenceError } = await supabase
      .from('skill_evidence')
      .insert(
        validEvidence.map((e) => ({
          skill_id:      skill.id,
          url:           e.url.trim(),
          evidence_type: e.evidence_type,
          title:         e.title.trim() || null,
        }))
      )
    if (evidenceError) {
      // Non-fatal: skill was created, evidence failed
      console.error('Evidence insert failed:', evidenceError)
    }
  }

  revalidatePath('/skills')
  revalidatePath('/profile')
  return {}
}
```

---

## Task 6: Update LiveScorePreview

Update `components/LiveScorePreview.tsx` to accept the new props. Replace `yearsExperience` + `lastUsedYear` with `proficiencyAnchor`, and replace `evidenceCount` with `evidencePoints`.

```tsx
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
  follow_tutorials:    20,
  build_independently: 40,
  architect_and_mentor:60,
}

export default function LiveScorePreview({
  skillName,
  category,
  proficiencyAnchor,
  evidencePoints,
  context,
  isPrimary,
}: Props) {
  const proficiencyScore = proficiencyAnchor ? PROFICIENCY_SCORE[proficiencyAnchor] : 0
  const contextScore = context.trim().length >= 50 ? 15 : Math.round((context.trim().length / 50) * 15)
  const primaryBonus = isPrimary ? 10 : 0
  const total = Math.min(proficiencyScore + evidencePoints + contextScore + primaryBonus, 100)

  const badge = total >= 80 ? 'Expert' : total >= 50 ? 'Proficient' : 'Beginner'
  const badgeColor = total >= 80 ? 'text-orange-600 bg-orange-100' : total >= 50 ? 'text-blue-600 bg-blue-100' : 'text-gray-600 bg-gray-100'

  return (
    <div className="bg-white rounded-2xl elevation-1 p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Live Score Preview</h3>
        {skillName && <p className="text-lg font-bold text-gray-900">{skillName}</p>}
        {!skillName && <p className="text-sm text-gray-400 italic">Start typing to see your score</p>}
      </div>

      {/* Score ring */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="#f97316" strokeWidth="3"
              strokeDasharray={`${total} ${100 - total}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black text-gray-900">{total}</span>
          </div>
        </div>
        <div>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${badgeColor}`}>{badge}</span>
          <p className="text-xs text-gray-400 mt-1">{category}</p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Breakdown</p>
        {[
          { label: 'Proficiency', value: proficiencyScore, max: 60 },
          { label: 'Evidence',    value: evidencePoints,   max: 50 },
          { label: 'Context',     value: contextScore,     max: 15 },
          { label: 'Primary skill', value: primaryBonus,  max: 10 },
        ].map(({ label, value, max }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className="w-24 text-gray-500 shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 bg-orange-400 rounded-full transition-all"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <span className="w-12 text-right font-semibold text-gray-700">{value} / {max}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Task 7: Commit All Changes

```bash
git add components/SkillSearchInput.tsx components/ProficiencySelect.tsx components/EvidenceInput.tsx
git add components/SkillForm.tsx components/LiveScorePreview.tsx
git add app/actions/skills.ts
git commit -m "feat: skill form redesign — taxonomy search, proficiency anchors, typed evidence"
git push
```
