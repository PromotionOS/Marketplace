'use client'

interface Props {
  label: string
  active: boolean
  color: string
  onClick: () => void
}

export default function CategoryPill({ label, active, color, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? 'text-white shadow-md scale-105'
          : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500'
      }`}
      style={active ? { background: color } : {}}
    >
      {label}
    </button>
  )
}
