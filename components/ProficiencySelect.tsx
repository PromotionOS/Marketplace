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
    description: "Can architect systems, review others' work, and mentor the team.",
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
