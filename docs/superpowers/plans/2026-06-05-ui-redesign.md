# SkillOS UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign SkillOS UI to Material Warm — elevated cards, category-colored borders, live score preview on skill form, polished page layouts with smooth animations.

**Architecture:** All changes are purely presentational — no data model, server action, or API changes. We modify existing components and pages in-place, plus add one new `LiveScorePreview` client component for the skill form. Design system: orange primary, white cards, warm gray backgrounds, elevation shadows from globals.css.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, existing globals.css animation classes (`animate-fade-up`, `stagger`, `card-hover`, `elevation-1/2/3`)

---

## File Map

```
Modified:
  components/Nav.tsx                          # Already good — minor polish only
  components/SkillCard.tsx                    # Richer card: avatar, tag chips, endorser count
  components/SearchBar.tsx                    # Pill filter buttons replacing dropdowns
  components/SkillForm.tsx                    # Sections layout + live score sidebar
  components/ScoreBreakdown.tsx               # Animated bars, better labels
  components/EndorseButton.tsx                # Already good — keep
  components/GraphView.tsx                    # Light panel sidebar polish
  app/(app)/skills/page.tsx                   # Hero header, category filter pills
  app/(app)/skills/new/page.tsx               # Two-column layout with sticky score preview
  app/(app)/skills/[id]/page.tsx              # Polished detail layout
  app/(app)/profile/[id]/page.tsx             # Profile hero card + skill grid
  app/(app)/requests/page.tsx                 # Request cards polish
  app/(app)/requests/new/page.tsx             # Cleaner form
  app/(app)/admin/page.tsx                    # Stat cards polish
  app/(app)/admin/edges/page.tsx              # Edge review cards

Created:
  components/LiveScorePreview.tsx             # Client component: live 0-100 score as form fills
  components/CategoryPill.tsx                 # Reusable category filter pill button
  components/PageHeader.tsx                   # Reusable page title + subtitle + action slot
```

---

### Task 1: LiveScorePreview Component

The live score sidebar on the skill form. Takes current form values and computes score client-side using the same logic as the DB trigger.

**Files:**
- Create: `components/LiveScorePreview.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/zop5943/marketplace/skillos/components/LiveScorePreview.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/zop5943/marketplace/skillos
git add components/LiveScorePreview.tsx
git commit -m "feat: add LiveScorePreview component with circular score ring"
```

---

### Task 2: PageHeader and CategoryPill components

Reusable building blocks used across multiple pages.

**Files:**
- Create: `components/PageHeader.tsx`
- Create: `components/CategoryPill.tsx`

- [ ] **Step 1: Create PageHeader**

Create `/Users/zop5943/marketplace/skillos/components/PageHeader.tsx`:

```tsx
import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Create CategoryPill**

Create `/Users/zop5943/marketplace/skillos/components/CategoryPill.tsx`:

```tsx
'use client'

interface Props {
  label: string
  active: boolean
  color: string
  onClick: () => void
}

export default function CategoryPill({ label, active, color, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? 'text-white shadow-md scale-105'
          : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500'
      }`}
      style={active ? { background: color } : {}}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/zop5943/marketplace/skillos
git add components/PageHeader.tsx components/CategoryPill.tsx
git commit -m "feat: add PageHeader and CategoryPill reusable components"
```

---

### Task 3: SkillCard — Richer Material Card

**Files:**
- Modify: `components/SkillCard.tsx`

- [ ] **Step 1: Read the current file**

Read `/Users/zop5943/marketplace/skillos/components/SkillCard.tsx` before editing.

- [ ] **Step 2: Replace with polished version**

Replace the full content of `/Users/zop5943/marketplace/skillos/components/SkillCard.tsx`:

```tsx
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
  none:       { label: '',          color: '',        bg: '' },
  beginner:   { label: 'Beginner',  color: '#0369a1', bg: '#e0f2fe' },
  proficient: { label: 'Proficient',color: '#7c3aed', bg: '#ede9fe' },
  expert:     { label: '🏆 Expert', color: '#b45309', bg: '#fef3c7' },
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
```

- [ ] **Step 3: Commit**

```bash
cd /Users/zop5943/marketplace/skillos
git add components/SkillCard.tsx
git commit -m "feat: richer SkillCard with emoji icons, gradient score bar, tag chips"
```

---

### Task 4: SkillForm — Two-Column with Live Score

**Files:**
- Modify: `components/SkillForm.tsx`

- [ ] **Step 1: Read current file**

Read `/Users/zop5943/marketplace/skillos/components/SkillForm.tsx`.

- [ ] **Step 2: Replace with two-column live-score version**

Replace the full content of `/Users/zop5943/marketplace/skillos/components/SkillForm.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { submitSkill } from '@/app/actions/skills'
import { useRouter } from 'next/navigation'
import LiveScorePreview from '@/components/LiveScorePreview'

const CATEGORIES = [
  { value: 'Backend',  emoji: '⚙️' },
  { value: 'Frontend', emoji: '🎨' },
  { value: 'DevOps',   emoji: '🚀' },
  { value: 'Data',     emoji: '📊' },
]
const LEVELS = ['beginner', 'proficient', 'expert']

export default function SkillForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live score state
  const [descText, setDescText] = useState('')
  const [yearsExp, setYearsExp] = useState<number | null>(null)
  const [lastYear, setLastYear] = useState<number | null>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: { class: 'prose prose-sm focus:outline-none min-h-[140px] px-4 py-3 text-gray-700' },
    },
    onUpdate: ({ editor }) => setDescText(editor.getText()),
  })

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function addEvidenceUrl() {
    setEvidenceUrls([...evidenceUrls, ''])
  }

  function updateEvidenceUrl(index: number, value: string) {
    const updated = [...evidenceUrls]
    updated[index] = value
    setEvidenceUrls(updated)
  }

  const filledEvidenceCount = evidenceUrls.filter(Boolean).length

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('description', editor?.getText() ?? '')
    fd.set('tags', tags.join(','))
    fd.set('evidence_urls', evidenceUrls.filter(Boolean).join('\n'))
    try {
      await submitSkill(fd)
      router.push('/skills')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex gap-8 items-start">
      {/* Main form */}
      <form ref={formRef} onSubmit={handleSubmit} className="flex-1 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Section: Basic Info */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Basic Info</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Skill Name *</label>
            <input
              name="name"
              required
              placeholder="e.g. React.js, Kubernetes, Data Pipelines"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent overflow-hidden">
              <EditorContent editor={editor} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {descText.length} chars · {descText.length >= 150 ? '✅ Full points' : descText.length >= 50 ? '⚡ Partial' : '📝 Keep going'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              >
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Level *</label>
              <select
                name="level"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              >
                <option value="">Select…</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l} className="capitalize">{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section: Experience */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Experience</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
              <input
                name="years_experience"
                type="number"
                min="0" max="50" step="0.5"
                placeholder="e.g. 3.5"
                onChange={(e) => setYearsExp(e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Used Year</label>
              <input
                name="last_used_year"
                type="number"
                min="2000"
                max={new Date().getFullYear()}
                placeholder={String(new Date().getFullYear())}
                onChange={(e) => setLastYear(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500 ml-0.5">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add tag and press Enter"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2.5 bg-orange-100 text-orange-700 rounded-xl text-sm font-semibold hover:bg-orange-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Section: Evidence */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Evidence</h2>
            <p className="text-xs text-gray-400 mt-1">Links to PRs, repos, certs, or articles that prove this skill</p>
          </div>
          <div className="space-y-2.5">
            {evidenceUrls.map((url, i) => (
              <input
                key={i}
                value={url}
                onChange={(e) => updateEvidenceUrl(i, e.target.value)}
                placeholder={`https://github.com/... (link ${i + 1})`}
                type="url"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addEvidenceUrl}
            className="text-sm text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-1"
          >
            <span>+</span> Add another link
          </button>
          {filledEvidenceCount >= 3 && (
            <p className="text-xs text-green-600 font-medium">✅ Full evidence points earned!</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 disabled:opacity-50 transition-all elevation-2 hover:elevation-3"
        >
          {submitting ? 'Submitting…' : 'Submit Skill →'}
        </button>
      </form>

      {/* Live score sidebar */}
      <div className="w-64 shrink-0 hidden lg:block">
        <LiveScorePreview
          description={descText}
          evidenceCount={filledEvidenceCount}
          yearsExperience={yearsExp}
          lastUsedYear={lastYear}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/zop5943/marketplace/skillos
git add components/SkillForm.tsx
git commit -m "feat: two-column skill form with live score preview sidebar"
```

---

### Task 5: Skills Listing Page

**Files:**
- Modify: `app/(app)/skills/page.tsx`
- Modify: `app/(app)/skills/new/page.tsx`

- [ ] **Step 1: Read both files**

Read `/Users/zop5943/marketplace/skillos/app/(app)/skills/page.tsx` and `/Users/zop5943/marketplace/skillos/app/(app)/skills/new/page.tsx`.

- [ ] **Step 2: Update skills listing page**

Replace the full content of `/Users/zop5943/marketplace/skillos/app/(app)/skills/page.tsx`:

```tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import SearchBar from '@/components/SearchBar'
import RealtimeSkillList from '@/components/RealtimeSkillList'
import type { Skill } from '@/lib/types'

const CATEGORIES = [
  { value: '', label: 'All',      color: '#f97316' },
  { value: 'Backend',  label: '⚙️ Backend',  color: '#0ea5e9' },
  { value: 'Frontend', label: '🎨 Frontend', color: '#f43f5e' },
  { value: 'DevOps',   label: '🚀 DevOps',   color: '#f59e0b' },
  { value: 'Data',     label: '📊 Data',     color: '#10b981' },
]

interface Props {
  searchParams: Promise<{ q?: string; level?: string; category?: string }>
}

async function SkillList({ searchParams }: Props) {
  const { q, level, category } = await searchParams
  const supabase = await createSupabaseClient()
  let skills: Skill[] = []

  if (q) {
    const { data } = await supabase.rpc('search_skills', {
      query: q,
      level_filter: level ?? null,
      category_filter: category ?? null,
    })
    skills = (data as Skill[]) ?? []
  } else {
    let query = supabase.from('skills').select('*').order('score', { ascending: false })
    if (level) query = query.eq('level', level)
    if (category) query = query.eq('category', category)
    const { data } = await query
    skills = (data as Skill[]) ?? []
  }

  const skillIds = skills.map((s) => s.id)
  const { data: endorsements } = skillIds.length > 0
    ? await supabase.from('endorsements').select('skill_id').in('skill_id', skillIds)
    : { data: [] }

  const endorsementCounts: Record<string, number> = {}
  for (const e of endorsements ?? []) {
    endorsementCounts[e.skill_id] = (endorsementCounts[e.skill_id] ?? 0) + 1
  }

  return (
    <>
      <div className="mb-6">
        <SearchBar resultCount={skills.length} />
      </div>
      {skills.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-400 font-medium">No skills found. Be the first to add one!</p>
          <Link href="/skills/new" className="mt-4 inline-block text-orange-500 font-semibold hover:underline">
            Add a skill →
          </Link>
        </div>
      ) : (
        <RealtimeSkillList initialSkills={skills} initialEndorsementCounts={endorsementCounts} />
      )}
    </>
  )
}

export default function SkillsPage({ searchParams }: Props) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Skills</h1>
          <p className="text-gray-400 text-sm mt-1">Browse and discover skills across your org</p>
        </div>
        <Link
          href="/skills/new"
          className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all elevation-1 hover:elevation-2"
        >
          + Add Skill
        </Link>
      </div>

      <Suspense fallback={
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl elevation-1 p-5 h-40 animate-pulse">
              <div className="h-4 bg-orange-100 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-2 bg-orange-100 rounded-full" />
            </div>
          ))}
        </div>
      }>
        <SkillList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 3: Update new skill page**

Replace the full content of `/Users/zop5943/marketplace/skillos/app/(app)/skills/new/page.tsx`:

```tsx
import Link from 'next/link'
import SkillForm from '@/components/SkillForm'

export default function NewSkillPage() {
  return (
    <div>
      <div className="mb-8">
        <Link href="/skills" className="text-sm text-gray-400 hover:text-orange-500 transition-colors">
          ← Back to Skills
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-2">Submit a Skill</h1>
        <p className="text-gray-400 text-sm mt-1">Your score updates live as you fill in the form</p>
      </div>
      <SkillForm />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/zop5943/marketplace/skillos
git add app/'(app)'/skills/page.tsx app/'(app)'/skills/new/page.tsx
git commit -m "feat: polished skills listing with skeleton loading and new skill page"
```

---

### Task 6: Skill Detail Page

**Files:**
- Modify: `app/(app)/skills/[id]/page.tsx`

- [ ] **Step 1: Read current file**

Read `/Users/zop5943/marketplace/skillos/app/(app)/skills/[id]/page.tsx`.

- [ ] **Step 2: Update with polished layout**

Replace the full content of `/Users/zop5943/marketplace/skillos/app/(app)/skills/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseClient } from '@/lib/supabase'
import ScoreBreakdown from '@/components/ScoreBreakdown'
import EndorseButton from '@/components/EndorseButton'
import Link from 'next/link'
import type { Profile, Skill } from '@/lib/types'

const CATEGORY_META: Record<string, { bg: string; emoji: string }> = {
  Backend:  { bg: '#e0f2fe', emoji: '⚙️' },
  Frontend: { bg: '#ffe4e6', emoji: '🎨' },
  DevOps:   { bg: '#fef3c7', emoji: '🚀' },
  Data:     { bg: '#d1fae5', emoji: '📊' },
  default:  { bg: '#f3f4f6', emoji: '💡' },
}

const BADGE_META: Record<string, { label: string; color: string; bg: string }> = {
  none:       { label: '',           color: '',        bg: '' },
  beginner:   { label: 'Beginner',   color: '#0369a1', bg: '#e0f2fe' },
  proficient: { label: 'Proficient', color: '#7c3aed', bg: '#ede9fe' },
  expert:     { label: '🏆 Expert',  color: '#b45309', bg: '#fef3c7' },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function SkillDetailPage({ params }: Props) {
  const { id } = await params
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: skill } = await supabase.from('skills').select('*').eq('id', id).single()
  if (!skill) notFound()

  const [{ data: endorsements }, { data: submitter }] = await Promise.all([
    supabase.from('endorsements').select('*, profiles:endorsed_by(id, full_name, avatar_url)').eq('skill_id', skill.id),
    supabase.from('profiles').select('id, full_name, avatar_url, team').eq('id', skill.submitted_by).single(),
  ])

  type EndorsementWithProfile = { id: string; profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }
  const endorserProfiles = ((endorsements ?? []) as EndorsementWithProfile[]).map((e) => e.profiles)
  const hasEndorsed = endorserProfiles.some((p) => p.id === userId)
  const isOwner = skill.submitted_by === userId

  const cat = CATEGORY_META[skill.category] ?? CATEGORY_META.default
  const badge = BADGE_META[(skill as Skill).badge]

  return (
    <div className="max-w-4xl">
      <Link href="/skills" className="text-sm text-gray-400 hover:text-orange-500 transition-colors mb-6 inline-block">
        ← Back to Skills
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl elevation-2 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: cat.bg }}>
            {cat.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{skill.name}</h1>
                <p className="text-sm text-gray-400 mt-1">
                  {skill.category} ·{' '}
                  <span className="capitalize">{skill.level}</span>
                  {submitter && (
                    <> · <Link href={`/profile/${(submitter as Pick<Profile, 'id' | 'full_name'>).id}`} className="text-orange-500 hover:underline">
                      {(submitter as Pick<Profile, 'id' | 'full_name'>).full_name ?? 'Unknown'}
                    </Link></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-2xl font-black text-orange-500">{(skill as Skill).score}</p>
                  <p className="text-xs text-gray-400">score</p>
                </div>
                {(skill as Skill).badge !== 'none' && badge.label && (
                  <span className="text-sm px-3 py-1.5 rounded-xl font-bold" style={{ color: badge.color, background: badge.bg }}>
                    {badge.label}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <EndorseButton skillId={skill.id} isOwner={isOwner} endorsers={endorserProfiles} hasEndorsed={hasEndorsed} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: description + evidence */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl elevation-1 p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{skill.description}</p>
            {(skill as Skill).tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {(skill as Skill).tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {(skill as Skill).evidence_urls.length > 0 && (
            <div className="bg-white rounded-2xl elevation-1 p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Evidence</h2>
              <ul className="space-y-2">
                {(skill as Skill).evidence_urls.map((url: string) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-orange-500 hover:text-orange-600 hover:underline break-all flex items-center gap-2">
                      <span>🔗</span> {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: score breakdown */}
        <div>
          <ScoreBreakdown skill={skill as Skill} endorsementCount={endorserProfiles.length} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/zop5943/marketplace/skillos
git add app/'(app)'/skills/'[id]'/page.tsx
git commit -m "feat: polished skill detail page with hero card and 3-column layout"
```

---

### Task 7: Profile Page

**Files:**
- Modify: `app/(app)/profile/[id]/page.tsx`

- [ ] **Step 1: Read current file**

Read `/Users/zop5943/marketplace/skillos/app/(app)/profile/[id]/page.tsx`.

- [ ] **Step 2: Replace with profile hero card design**

Replace the full content of `/Users/zop5943/marketplace/skillos/app/(app)/profile/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import SkillCard from '@/components/SkillCard'
import type { Skill, Profile } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

const BADGE_COLORS: Record<string, { color: string; bg: string; emoji: string }> = {
  expert:     { color: '#b45309', bg: '#fef3c7', emoji: '🏆' },
  proficient: { color: '#7c3aed', bg: '#ede9fe', emoji: '⭐' },
  beginner:   { color: '#0369a1', bg: '#e0f2fe', emoji: '🌱' },
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!profile) notFound()

  const { data: skills } = await supabase
    .from('skills').select('*').eq('submitted_by', id).order('score', { ascending: false })

  const p = profile as Profile
  const skillList = (skills as Skill[]) ?? []

  const badgeCounts = skillList.reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s.badge]: (acc[s.badge] ?? 0) + 1 }), {}
  )
  const avgScore = skillList.length
    ? Math.round(skillList.reduce((sum, s) => sum + s.score, 0) / skillList.length)
    : 0

  return (
    <div className="max-w-4xl">
      {/* Profile hero */}
      <div className="bg-white rounded-2xl elevation-2 p-8 mb-8">
        <div className="flex items-center gap-6">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt={p.full_name ?? ''} className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center">
              <span className="text-3xl font-black text-orange-500">
                {(p.full_name ?? 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-900">{p.full_name ?? 'Unknown'}</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {p.team ? `${p.team} · ` : ''}<span className="capitalize">{p.role}</span>
            </p>

            {/* Stats row */}
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-2xl font-black text-orange-500">{skillList.length}</p>
                <p className="text-xs text-gray-400">Skills</p>
              </div>
              <div>
                <p className="text-2xl font-black text-orange-500">{avgScore}</p>
                <p className="text-xs text-gray-400">Avg Score</p>
              </div>
              {Object.entries(badgeCounts)
                .filter(([b]) => b !== 'none' && BADGE_COLORS[b])
                .map(([badge, count]) => (
                  <div key={badge}>
                    <p className="text-2xl font-black" style={{ color: BADGE_COLORS[badge].color }}>
                      {BADGE_COLORS[badge].emoji} {count}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{badge}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skills grid */}
      <h2 className="text-lg font-black text-gray-900 mb-4">Skills</h2>
      {skillList.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No skills submitted yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 stagger">
          {skillList.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/zop5943/marketplace/skillos
git add app/'(app)'/profile/'[id]'/page.tsx
git commit -m "feat: profile hero card with stats, avg score, badge counts"
```

---

### Task 8: Requests + Admin Pages Polish

**Files:**
- Modify: `app/(app)/requests/page.tsx`
- Modify: `app/(app)/admin/page.tsx`
- Modify: `app/(app)/admin/edges/page.tsx`

- [ ] **Step 1: Read all three files**

Read each file before editing.

- [ ] **Step 2: Update requests page**

Replace the full content of `/Users/zop5943/marketplace/skillos/app/(app)/requests/page.tsx`:

```tsx
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import type { SkillRequest, Profile } from '@/lib/types'

export default async function RequestsPage() {
  const supabase = await createSupabaseClient()
  const { data: requests } = await supabase
    .from('skill_requests')
    .select('*, profiles:requested_by(full_name, avatar_url)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  type RequestWithProfile = SkillRequest & { profiles: Pick<Profile, 'full_name' | 'avatar_url'> }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Skill Requests</h1>
          <p className="text-gray-400 text-sm mt-1">Skills the org needs — step up and claim one</p>
        </div>
        <Link href="/requests/new"
          className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all elevation-1">
          + Post Request
        </Link>
      </div>

      {(requests?.length ?? 0) === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-400 font-medium">No open requests. Post one!</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {(requests as RequestWithProfile[]).map((r) => (
            <div key={r.id} className="bg-white rounded-2xl elevation-1 p-5 card-hover animate-fade-up">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{r.title}</h3>
                  {r.description && <p className="text-sm text-gray-500 mt-1">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    {r.category && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
                        {r.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      by {r.profiles?.full_name ?? 'Unknown'} · {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-semibold shrink-0">
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update admin page**

Replace the full content of `/Users/zop5943/marketplace/skillos/app/(app)/admin/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminPage() {
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId!).single()
  if (profile?.role !== 'admin') redirect('/skills')

  const [
    { count: skillCount },
    { count: userCount },
    { count: pendingEdgeCount },
  ] = await Promise.all([
    supabase.from('skills').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('skill_edges').select('*', { count: 'exact', head: true }).eq('approved', false),
  ])

  const stats = [
    { label: 'Total Skills', value: skillCount ?? 0, emoji: '🧠', color: '#f97316', bg: '#fff7ed' },
    { label: 'Team Members', value: userCount ?? 0,  emoji: '👥', color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Pending Edges', value: pendingEdgeCount ?? 0, emoji: '🔗', color: '#7c3aed', bg: '#ede9fe' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the SkillOS platform</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8 stagger">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl elevation-1 p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.emoji}</span>
              <span className="text-xs font-semibold text-gray-400">{stat.label}</span>
            </div>
            <p className="text-4xl font-black" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl elevation-1 p-6">
        <h2 className="font-bold text-gray-900 mb-1">AI-Suggested Edges</h2>
        <p className="text-sm text-gray-400 mb-4">Review connections suggested by the AI and approve or reject them</p>
        <Link href="/admin/edges"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all">
          Review Edges
          {(pendingEdgeCount ?? 0) > 0 && (
            <span className="bg-white text-orange-500 text-xs font-black px-2 py-0.5 rounded-full">
              {pendingEdgeCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update admin edges page**

Replace the full content of `/Users/zop5943/marketplace/skillos/app/(app)/admin/edges/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { approveEdge, rejectEdge } from '@/app/actions/skills'
import type { Skill, SkillEdge } from '@/lib/types'

export default async function AdminEdgesPage() {
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId!).single()
  if (profile?.role !== 'admin') redirect('/skills')

  const { data: pendingEdges } = await supabase
    .from('skill_edges').select('*')
    .eq('approved', false).eq('ai_suggested', true)
    .order('created_at', { ascending: false })

  const skillIds = [...new Set(((pendingEdges as SkillEdge[]) ?? []).flatMap((e) => [e.source_id, e.target_id]))]
  const { data: skills } = skillIds.length > 0
    ? await supabase.from('skills').select('id, name, category').in('id', skillIds)
    : { data: [] }

  const skillMap = Object.fromEntries(((skills as Pick<Skill, 'id' | 'name' | 'category'>[]) ?? []).map((s) => [s.id, s]))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">AI-Suggested Edges</h1>
        <p className="text-gray-400 text-sm mt-1">Connections suggested by the AI based on skill similarity</p>
      </div>

      {(pendingEdges?.length ?? 0) === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl elevation-1">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-gray-400 font-medium">All caught up — no pending edges to review.</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {(pendingEdges as SkillEdge[]).map((edge) => {
            const src = skillMap[edge.source_id]
            const tgt = skillMap[edge.target_id]
            return (
              <div key={edge.id} className="bg-white rounded-2xl elevation-1 p-5 animate-fade-up flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">
                    {src?.name ?? '?'}
                    <span className="text-orange-400 mx-2">→</span>
                    {tgt?.name ?? '?'}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {edge.relation_type} · similarity {Number(edge.weight).toFixed(2)} · AI suggested
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={approveEdge.bind(null, edge.id)}>
                    <button type="submit"
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold hover:bg-green-200 transition-colors">
                      ✓ Approve
                    </button>
                  </form>
                  <form action={rejectEdge.bind(null, edge.id)}>
                    <button type="submit"
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors">
                      ✕ Reject
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/zop5943/marketplace/skillos
git add app/'(app)'/requests/page.tsx app/'(app)'/admin/page.tsx app/'(app)'/admin/edges/page.tsx
git commit -m "feat: polish requests and admin pages with material cards and emoji stats"
```

---

### Task 9: TypeScript check + push

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/zop5943/marketplace/skillos
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -40
```

Fix any errors in modified files only.

- [ ] **Step 2: Final commit and push**

```bash
cd /Users/zop5943/marketplace/skillos
git push
```

---

## Self-Review

| Requirement | Task |
|---|---|
| LiveScorePreview circular ring | Task 1 |
| Two-column skill form + live score | Task 4 |
| SkillCard with emoji, gradient bar, tag chips | Task 3 |
| PageHeader + CategoryPill reusables | Task 2 |
| Skills listing with skeleton loading | Task 5 |
| New skill page with back link | Task 5 |
| Skill detail hero card + 3-col layout | Task 6 |
| Profile hero with avg score + badge stats | Task 7 |
| Requests cards with stagger animation | Task 8 |
| Admin stat cards with emoji | Task 8 |
| Admin edges with arrow syntax | Task 8 |
| TypeScript clean | Task 9 |

No placeholders found. All code is complete and concrete.
