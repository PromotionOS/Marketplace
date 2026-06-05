'use client'

import { useEffect, useRef, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase-browser'
import type { SkillTaxonomy } from '@/lib/types'

interface Props {
  value: string
  taxonomyId: string | null
  onChange: (name: string, taxonomyId: string | null) => void
}

export default function SkillSearchInput({ value, taxonomyId, onChange }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SkillTaxonomy[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = getBrowserClient()
      const { data } = await supabase
        .from('skill_taxonomy')
        .select('*')
        .or(`name.ilike.%${query}%`)
        .order('name')
        .limit(8)
      setResults((data as SkillTaxonomy[]) ?? [])
      setLoading(false)
      setOpen(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const CATEGORY_EMOJI: Record<string, string> = {
    Backend: '⚙️', Frontend: '🎨', DevOps: '🚀', Data: '📊',
    Mobile: '📱', Security: '🔒', 'AI/ML': '🤖', Other: '💡',
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value, null) }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search skills (e.g. React, Kubernetes, dbt...)"
          className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
        />
        {taxonomyId && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            ✓ Matched
          </span>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-100 elevation-3 overflow-hidden">
          {loading && <p className="px-4 py-3 text-sm text-gray-400">Searching...</p>}
          {results.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => { setQuery(skill.name); onChange(skill.name, skill.id); setOpen(false) }}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-center gap-3"
            >
              <span className="text-lg">{CATEGORY_EMOJI[skill.category] ?? '💡'}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{skill.name}</p>
                <p className="text-xs text-gray-400">{skill.category}{skill.subcategory ? ` · ${skill.subcategory}` : ''}</p>
              </div>
            </button>
          ))}
          {!loading && query.length >= 2 && (
            <button
              type="button"
              onClick={() => { onChange(query, null); setOpen(false) }}
              className="w-full text-left px-4 py-3 border-t border-gray-50 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              + Add &quot;{query}&quot; as a custom skill
            </button>
          )}
        </div>
      )}
    </div>
  )
}
