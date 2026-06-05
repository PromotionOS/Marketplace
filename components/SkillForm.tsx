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
      <form ref={formRef} onSubmit={handleSubmit} className="flex-1 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

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
          className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 disabled:opacity-50 transition-all elevation-2"
        >
          {submitting ? 'Submitting…' : 'Submit Skill →'}
        </button>
      </form>

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
