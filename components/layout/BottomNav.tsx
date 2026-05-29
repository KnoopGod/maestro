'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Sparkles, CalendarDays, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { ShieldCheck, BarChart3, FolderOpen, Bot, Plug, Settings, DollarSign, X } from 'lucide-react'

const NAV_MAIN = [
  { href: '/',          icon: Home,         label: 'Home' },
  { href: '/clients',   icon: Users,        label: 'Clients' },
  { href: '/studio',    icon: Sparkles,     label: 'Studio' },
  { href: '/calendar',  icon: CalendarDays, label: 'Calendrier' },
]

const NAV_MORE = [
  { href: '/validation',  icon: ShieldCheck,  label: 'Validation' },
  { href: '/plan',        icon: CalendarDays, label: 'Historique' },
  { href: '/analytics',   icon: BarChart3,    label: 'Analytics' },
  { href: '/library',     icon: FolderOpen,   label: 'Library' },
  { href: '/agents',      icon: Bot,          label: 'Agents' },
  { href: '/connections', icon: Plug,         label: 'Connexions' },
  { href: '/usage',       icon: DollarSign,   label: 'Usage' },
  { href: '/settings',    icon: Settings,     label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  if (pathname === '/login') return null

  return (
    <>
      {/* More sheet */}
      {showMore && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#0d100e] border-t border-white/[0.08] rounded-t-3xl p-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-[#f5f1e8]">Navigation</span>
              <button onClick={() => setShowMore(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06]">
                <X className="w-4 h-4 text-[#9ba89d]" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {NAV_MORE.map(item => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                      active ? 'bg-[#d9a441]/12 text-[#f5d38b]' : 'text-[#9ba89d] hover:bg-white/[0.06]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] text-center leading-tight">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0d100e]/92 backdrop-blur-xl border-t border-white/[0.08] pb-safe">
        <div className="flex items-stretch h-16">
          {NAV_MAIN.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${
                  active ? 'text-[#d9a441]' : 'text-[#7f8a81]'
                }`}
              >
                {item.href === '/studio' ? (
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    active ? 'bg-[#d9a441]' : 'bg-[#d9a441]/80'
                  }`}>
                    <item.icon className="w-5 h-5 text-[#11140f]" />
                  </div>
                ) : (
                  <>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px]">{item.label}</span>
                  </>
                )}
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#7f8a81]"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px]">Plus</span>
          </button>
        </div>
      </nav>
    </>
  )
}
