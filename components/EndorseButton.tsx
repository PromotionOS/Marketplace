'use client'

import { useState } from 'react'
import { endorseSkill } from '@/app/actions/skills'
import type { Profile } from '@/lib/types'

interface Props {
  skillId: string
  isOwner: boolean
  endorsers: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]
  hasEndorsed: boolean
}

export default function EndorseButton({ skillId, isOwner, endorsers, hasEndorsed }: Props) {
  const [pending, setPending] = useState(false)
  const [endorsed, setEndorsed] = useState(hasEndorsed)
  const [count, setCount] = useState(endorsers.length)

  async function handleEndorse() {
    if (isOwner || endorsed) return
    setPending(true)
    try {
      await endorseSkill(skillId)
      setEndorsed(true)
      setCount((c) => c + 1)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleEndorse}
        disabled={isOwner || endorsed || pending}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          endorsed
            ? 'bg-green-100 text-green-700 cursor-default'
            : isOwner
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
        }`}
      >
        {endorsed ? 'Endorsed' : pending ? 'Endorsing…' : 'Endorse'}
      </button>

      <div className="flex items-center gap-1">
        <div className="flex -space-x-2">
          {endorsers.slice(0, 5).map((e) => (
            <div
              key={e.id}
              className="w-7 h-7 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center overflow-hidden"
              title={e.full_name ?? 'Unknown'}
            >
              {e.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.avatar_url} alt={e.full_name ?? ''} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-indigo-700 font-semibold">
                  {(e.full_name ?? '?')[0].toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-600">{count} endorsement{count !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
