'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, TrendingUp } from 'lucide-react'

const TABS = [
  { href: '/analytics', label: 'Vue d\'ensemble', icon: BarChart3, exact: true },
  { href: '/analytics/growth', label: 'Croissance', icon: TrendingUp, exact: false },
]

export function AnalyticsNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-0 border-b border-gray-800">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
