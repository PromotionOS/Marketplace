'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import CustomSelect from '@/components/CustomSelect'

const TEAM_OPTIONS = [
  { value: 'Engineering',      label: 'Engineering' },
  { value: 'Data Engineering', label: 'Data Engineering' },
  { value: 'Frontend',         label: 'Frontend' },
  { value: 'DevOps',           label: 'DevOps' },
  { value: 'Product',          label: 'Product' },
  { value: 'Design',           label: 'Design' },
  { value: 'Data Science',     label: 'Data Science' },
  { value: 'Analytics',        label: 'Analytics' },
]

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [team, setTeam] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!team) { setError('Please select your team'); return }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team }),
      })
      if (!res.ok) throw new Error('Failed to save')
      router.push('/skills')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl elevation-2 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">👋</p>
          <h1 className="text-2xl font-black text-gray-900">Welcome to SkillOS</h1>
          <p className="text-gray-400 text-sm mt-2">
            Hi {user?.firstName ?? 'there'}! One quick thing before we start.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Which team are you on? *</label>
            <CustomSelect value={team} onChange={setTeam} options={TEAM_OPTIONS} placeholder="Select your team" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition-all elevation-1"
          >
            {submitting ? 'Saving…' : "Let's go →"}
          </button>
        </form>
      </div>
    </div>
  )
}
