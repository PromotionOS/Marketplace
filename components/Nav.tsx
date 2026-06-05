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
    <nav className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/skills" className="font-semibold text-lg text-indigo-600">
          SkillOS
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium ${
              pathname.startsWith(l.href)
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
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
