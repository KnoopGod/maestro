'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Sparkles, CalendarDays, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { ShieldCheck, BarChart3, FolderOpen, Bot, Plug, Settings, DollarSign, X, LogOut } from 'lucide-react'

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
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#07081A] border-t border-indigo-950/60 rounded-t-2xl p-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white" id="more-nav-title">Navigation</span>
              <button
                onClick={() => setShowMore(false)}
                aria-label="Fermer le menu de navigation"
                title="Fermer le menu de navigation mobile"
                className="p-1.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-800/60 flex items-center justify-center"
              >
                <X aria-hidden="true" className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <nav aria-labelledby="more-nav-title">
              <div className="grid grid-cols-4 gap-2">
                {NAV_MORE.map(item => {
                  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      title={`${item.label} — ouvrir cette section`}
                      onClick={() => setShowMore(false)}
                      className={`flex flex-col items-center gap-1.5 p-3 min-h-[64px] rounded-xl transition-all ${
                        active ? 'bg-indigo-950/60 text-indigo-300' : 'text-gray-400 hover:bg-indigo-950/40'
                      }`}
                    >
                      <item.icon aria-hidden="true" className="w-5 h-5" />
                      <span className="text-[10px] text-center leading-tight">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>
            <form action="/api/auth/logout" method="post" className="mt-4">
              <button
                type="submit"
                title="Fermer la session et revenir à la page de connexion"
                className="w-full min-h-[44px] rounded-xl border border-red-900/40 bg-red-950/20 text-red-300 text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#07081A]/95 backdrop-blur-xl border-t border-indigo-950/60 pb-safe">
        <div className="flex items-stretch h-16">
          {NAV_MAIN.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={`${item.label} — ouvrir cette section`}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${
                  active ? 'text-indigo-400' : 'text-gray-500'
                }`}
              >
                {item.href === '/studio' ? (
                  <div aria-hidden="true" className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    active ? 'bg-indigo-600' : 'bg-indigo-600'
                  }`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <>
                    <item.icon aria-hidden="true" className="w-5 h-5" />
                    <span className="text-[10px]">{item.label}</span>
                  </>
                )}
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(true)}
            aria-label="Afficher plus de navigation"
            aria-expanded={showMore}
            title="Afficher les autres sections de l'application"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-500"
          >
            <MoreHorizontal aria-hidden="true" className="w-5 h-5" />
            <span aria-hidden="true" className="text-[10px]">Plus</span>
          </button>
        </div>
      </nav>
    </>
  )
}
