'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
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

export default function ProfileSettingsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [team, setTeam] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!team) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSuccess(true)
      setTimeout(() => router.push(`/profile/${user?.id}`), 1000)
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Profile Settings</h1>
      <p className="text-gray-400 text-sm mb-8">Update your team information</p>

      <div className="bg-white rounded-2xl elevation-1 p-6">
        <form onSubmit={handleSave} className="space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">✅ Saved! Redirecting...</div>}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <p className="text-sm text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
              {user?.fullName ?? 'Managed by Clerk'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Team</label>
            <CustomSelect value={team} onChange={setTeam} options={TEAM_OPTIONS} placeholder="Select team" />
          </div>

          <button
            type="submit"
            disabled={saving || !team}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
