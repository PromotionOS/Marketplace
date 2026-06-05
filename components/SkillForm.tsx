'use client'

import { useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { submitSkill } from '@/app/actions/skills'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Backend', 'Frontend', 'DevOps', 'Data']
const LEVELS = ['beginner', 'proficient', 'expert']

export default function SkillForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: { class: 'prose prose-sm focus:outline-none min-h-[120px] px-3 py-2' },
    },
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)
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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name *</label>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <div className="rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500">
          <EditorContent editor={editor} />
        </div>
        <p className="text-xs text-gray-400 mt-1">50+ chars for score points, 150+ for full points</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            name="category"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
          <select
            name="level"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select level</option>
            {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
          <input
            name="years_experience"
            type="number"
            min="0"
            max="50"
            step="0.5"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Used Year</label>
          <input
            name="last_used_year"
            type="number"
            min="2000"
            max={new Date().getFullYear()}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full"
            >
              {t}
              <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="Add a tag"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Links (PRs, repos, certs)</label>
        <div className="space-y-2">
          {evidenceUrls.map((url, i) => (
            <input
              key={i}
              value={url}
              onChange={(e) => updateEvidenceUrl(i, e.target.value)}
              placeholder="https://github.com/..."
              type="url"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addEvidenceUrl}
          className="mt-2 text-sm text-indigo-600 hover:underline"
        >
          + Add another link
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Skill'}
      </button>
    </form>
  )
}
