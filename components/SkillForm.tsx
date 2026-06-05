'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SkillSearchInput from '@/components/SkillSearchInput'
import ProficiencySelect from '@/components/ProficiencySelect'
import EvidenceInput, { type EvidenceItem } from '@/components/EvidenceInput'
import LiveScorePreview from '@/components/LiveScorePreview'
import { submitSkill } from '@/app/actions/skills'
import type { ProficiencyAnchor } from '@/lib/types'

const CATEGORY_OPTIONS = ['Backend', 'Frontend', 'DevOps', 'Data', 'Mobile', 'Security', 'AI/ML', 'Other'] as const
type Category = typeof CATEGORY_OPTIONS[number]

interface InitialValues {
  skillId: string
  skillName: string
  taxonomyId: string | null
  category: Category
  proficiencyAnchor: ProficiencyAnchor | null
  context: string
  evidence: EvidenceItem[]
  tags: string
  isPrimary: boolean
  availableToMentor: boolean
}

interface Props {
  initialValues?: InitialValues
}

const EVIDENCE_POINTS: Record<string, number> = {
  github_pr: 20, shipped_product: 18, certificate: 15,
  github_repo: 10, article: 8, other: 5,
}

export default function SkillForm({ initialValues }: Props = {}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [skillName, setSkillName] = useState(initialValues?.skillName ?? '')
  const [taxonomyId, setTaxonomyId] = useState<string | null>(initialValues?.taxonomyId ?? null)
  const [category, setCategory] = useState<Category>(initialValues?.category ?? 'Backend')
  const [proficiencyAnchor, setProficiencyAnchor] = useState<ProficiencyAnchor | null>(initialValues?.proficiencyAnchor ?? null)
  const [context, setContext] = useState(initialValues?.context ?? '')
  const [evidence, setEvidence] = useState<EvidenceItem[]>(initialValues?.evidence ?? [])
  const [tags, setTags] = useState(initialValues?.tags ?? '')
  const [isPrimary, setIsPrimary] = useState(initialValues?.isPrimary ?? false)
  const [availableToMentor, setAvailableToMentor] = useState(initialValues?.availableToMentor ?? false)

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

    let result: { error?: string }

    if (initialValues?.skillId) {
      const { updateSkill } = await import('@/app/actions/skills')
      result = await updateSkill({
        id: initialValues.skillId,
        category,
        taxonomy_id: taxonomyId,
        proficiency_anchor: proficiencyAnchor,
        context: context.trim(),
        evidence,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_primary: isPrimary,
        available_to_mentor: availableToMentor,
      })
    } else {
      result = await submitSkill({
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
    }

    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      router.push(initialValues?.skillId ? `/skills/${initialValues.skillId}` : '/skills')
      router.refresh()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

        {/* Section 1: What's the skill? */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">What&apos;s the skill?</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Skill name</label>
            {initialValues?.skillId ? (
              <div className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-100 text-gray-500">
                {skillName} <span className="text-xs text-gray-400 ml-2">(name cannot be changed)</span>
              </div>
            ) : (
              <SkillSearchInput
                value={skillName}
                taxonomyId={taxonomyId}
                onChange={(name, tid) => { setSkillName(name); setTaxonomyId(tid) }}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    category === cat
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Proficiency */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">How good are you?</h2>
          <ProficiencySelect value={proficiencyAnchor} onChange={setProficiencyAnchor} />
        </div>

        {/* Section 3: Evidence */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">What have you built?</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Describe what you&apos;ve built with this skill
              <span className="ml-1 text-xs text-gray-400 font-normal">(min 50 chars)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              placeholder="e.g. Built a real-time analytics dashboard processing 1M events/day. Designed the schema and wrote all backend services in Go."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-gray-50"
            />
            <p className={`text-xs mt-1 ${context.length >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
              {context.length} chars {context.length >= 50 ? '✓' : `(${50 - context.length} more needed)`}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Evidence links</label>
            <EvidenceInput items={evidence} onChange={setEvidence} />
          </div>
        </div>

        {/* Section 4: Extra */}
        <div className="bg-white rounded-2xl elevation-1 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">Extra (optional)</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="distributed-systems, streaming, real-time (comma separated)"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
            />
          </div>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setIsPrimary(!isPrimary)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isPrimary ? 'bg-orange-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPrimary ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-900">Primary skill</p>
                <p className="text-xs text-gray-500">This is one of your top 3–5 skills</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setAvailableToMentor(!availableToMentor)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${availableToMentor ? 'bg-orange-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${availableToMentor ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
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
          className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed elevation-1"
        >
          {submitting ? 'Saving…' : initialValues?.skillId ? 'Save Changes →' : 'Add Skill →'}
        </button>
      </form>

      {/* Live Score Preview */}
      <div className="hidden lg:block">
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
