'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Users, Sparkles, Bot, CalendarDays, BarChart3,
  FolderOpen, Plug, Settings, Music2, DollarSign, ShieldCheck,
} from 'lucide-react'

const NAV_PRIMARY = [
  { href: '/',           icon: Home,         label: 'Home',      badge: '3' },
]

const NAV_WORK = [
  { href: '/clients',    icon: Users,        label: 'Clients',    badge: null },
  { href: '/studio',     icon: Sparkles,     label: 'Studio',     badge: 'NEW', badgeColor: 'bg-pink-600/30 text-pink-300' },
  { href: '/validation', icon: ShieldCheck,  label: 'Validation', badge: null },
  { href: '/calendar',   icon: CalendarDays, label: 'Calendrier', badge: null },
  { href: '/plan',       icon: CalendarDays, label: 'Historique', badge: null },
  { href: '/agents',     icon: Bot,          label: 'Agents',     badge: null },
  { href: '/analytics',  icon: BarChart3,    label: 'Analytics',  badge: null },
  { href: '/library',    icon: FolderOpen,   label: 'Library',    badge: null },
]

const NAV_SYSTEM = [
  { href: '/connections', icon: Plug,       label: 'Connexions', dot: true },
  { href: '/usage',       icon: DollarSign, label: 'Usage',      dot: false },
  { href: '/settings',    icon: Settings,   label: 'Settings',   dot: false },
]

function NavItem({
  href, icon: Icon, label, badge, badgeColor, dot,
}: {
  href: string
  icon: React.ElementType
  label: string
  badge?: string | null
  badgeColor?: string
  dot?: boolean
}) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-150 group
        ${active
          ? 'bg-purple-600/20 text-purple-300 border border-transparent border-l-2 border-l-purple-400 shadow-sm shadow-purple-900/20'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent'
        }`}
    >
      <Icon aria-hidden="true" className={`w-4 h-4 flex-shrink-0 ${active ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span aria-hidden="true" className={`text-[10px] px-1.5 py-0.5 rounded ${badgeColor ?? 'bg-purple-600/30 text-purple-300'}`}>
          {badge}
        </span>
      )}
      {dot && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-gray-950/90 backdrop-blur-xl border-r border-gray-800/50 flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800/50">
        <div aria-hidden="true" className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center shadow-lg shadow-purple-900/30">
          <Music2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-base font-bold text-white tracking-tight">Maestro</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">AI Conductor</div>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Navigation principale" className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_PRIMARY.map(item => <NavItem key={item.href} {...item} />)}

        <p className="pt-3 pb-1 px-3 text-[10px] uppercase tracking-widest text-gray-400 font-semibold" aria-hidden="true">
          Travail
        </p>
        {NAV_WORK.map(item => <NavItem key={item.href} {...item} />)}

        <p className="pt-3 pb-1 px-3 text-[10px] uppercase tracking-widest text-gray-400 font-semibold" aria-hidden="true">
          Système
        </p>
        {NAV_SYSTEM.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Profile */}
      <div className="px-3 py-3 border-t border-gray-800/50">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800/40 cursor-pointer transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-600 to-fuchsia-700 flex items-center justify-center text-xs font-bold text-white">
            BD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">Bradley Dave</div>
            <div className="text-[10px] text-gray-500">Pro plan</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
