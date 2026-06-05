'use client'

import { useEffect, useRef, useState } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Select…', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all bg-white ${
          open
            ? 'border-orange-400 ring-2 ring-orange-400 ring-offset-0'
            : 'border-gray-200 hover:border-orange-300'
        } ${value ? 'text-gray-900' : 'text-gray-400'}`}
      >
        <span>{selected?.label ?? placeholder}</span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-100 elevation-3 overflow-hidden">
          {placeholder && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === '' ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                value === opt.value
                  ? 'bg-orange-50 text-orange-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
