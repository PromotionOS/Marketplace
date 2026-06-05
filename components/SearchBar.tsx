'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import CustomSelect from '@/components/CustomSelect'

const LEVEL_OPTIONS = [
  { value: 'beginner',   label: 'Beginner' },
  { value: 'proficient', label: 'Proficient' },
  { value: 'expert',     label: 'Expert' },
]

const CATEGORY_OPTIONS = [
  { value: 'Backend',  label: '⚙️ Backend' },
  { value: 'Frontend', label: '🎨 Frontend' },
  { value: 'DevOps',   label: '🚀 DevOps' },
  { value: 'Data',     label: '📊 Data' },
]

interface Props {
  resultCount?: number
}

export default function SearchBar({ resultCount }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [level, setLevel] = useState(searchParams.get('level') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (level) params.set('level', level)
      if (category) params.set('category', category)
      router.replace(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, level, category, router, pathname])

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
      {/* Search input */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search skills, tags, people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white hover:border-orange-300 transition-colors"
        />
      </div>

      {/* Level filter */}
      <CustomSelect
        value={level}
        onChange={setLevel}
        options={LEVEL_OPTIONS}
        placeholder="All levels"
        className="w-full sm:w-36"
      />

      {/* Category filter */}
      <CustomSelect
        value={category}
        onChange={setCategory}
        options={CATEGORY_OPTIONS}
        placeholder="All categories"
        className="w-full sm:w-44"
      />

      {resultCount !== undefined && (
        <span className="text-sm text-gray-400 self-center whitespace-nowrap font-medium">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
