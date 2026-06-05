'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const links = [
  { href: '/skills', label: 'Skills' },
  { href: '/graph', label: 'Graph' },
  { href: '/requests', label: 'Requests' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav className="bg-white border-b border-orange-100 px-6 py-0 flex items-center justify-between elevation-1 sticky top-0 z-50">
      <div className="flex items-center gap-1">
        <Link href="/skills" className="font-bold text-xl text-orange-500 py-4 mr-4 tracking-tight">
          Skill<span className="text-stone-700">OS</span>
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium px-4 py-4 border-b-2 transition-colors ${
              pathname.startsWith(l.href)
                ? 'text-orange-500 border-orange-500'
                : 'text-gray-500 border-transparent hover:text-orange-500 hover:border-orange-300'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <UserButton />
    </nav>
  )
}
