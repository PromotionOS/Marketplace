'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postRequest } from '@/app/actions/skills'
import CustomSelect from '@/components/CustomSelect'

const CATEGORY_OPTIONS = [
  { value: 'Backend',  label: '⚙️ Backend' },
  { value: 'Frontend', label: '🎨 Frontend' },
  { value: 'DevOps',   label: '🚀 DevOps' },
  { value: 'Data',     label: '📊 Data' },
]

export default function NewRequestPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('category', category)
    try {
      await postRequest(fd)
      router.push('/requests')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Post a Request</h1>
      <p className="text-gray-400 text-sm mb-8">Tell the team what skill you need</p>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl elevation-1 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
          <input
            name="title"
            required
            placeholder="e.g. Need someone with Kafka experience"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            rows={4}
            placeholder="What do you need this skill for? Any context helps..."
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
          <CustomSelect
            value={category}
            onChange={setCategory}
            options={CATEGORY_OPTIONS}
            placeholder="Select category"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition-all elevation-1"
        >
          {submitting ? 'Posting…' : 'Post Request →'}
        </button>
      </form>
    </div>
  )
}
