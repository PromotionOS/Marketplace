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

export interface EvidenceItem {
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
