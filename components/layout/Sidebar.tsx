'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Users, Sparkles, Bot, CalendarDays, BarChart3,
  FolderOpen, Plug, Settings, Command, DollarSign, ShieldCheck,
} from 'lucide-react'

const NAV_PRIMARY = [
  { href: '/',           icon: Home,         label: 'Home',      badge: '3' },
]

const NAV_WORK = [
  { href: '/clients',    icon: Users,        label: 'Clients',    badge: null },
  { href: '/studio',     icon: Sparkles,     label: 'Studio',     badge: 'NEW', badgeColor: 'bg-[#76c893]/12 text-[#9fe6b8]' },
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
        ${active
          ? 'bg-[#d9a441]/12 text-[#f5d38b] border border-[#d9a441]/24 shadow-[0_10px_30px_rgb(217_164_65_/_8%)]'
          : 'text-[#9ba89d] hover:text-[#f5f1e8] hover:bg-white/[0.04] border border-transparent'
        }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#d9a441]' : 'text-[#667268] group-hover:text-[#d6ded7]'}`} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${badgeColor ?? 'bg-[#d9a441]/15 text-[#f5d38b]'}`}>
          {badge}
        </span>
      )}
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex fixed left-3 top-3 bottom-3 w-64 codexrs-panel rounded-3xl flex-col z-40 overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="rounded-2xl border border-[#d9a441]/20 bg-[#d9a441]/8 p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f5f1e8] flex items-center justify-center shadow-lg shadow-black/30">
              <Command className="w-5 h-5 text-[#11140f]" />
            </div>
            <div>
              <div className="text-base font-bold text-[#f5f1e8] tracking-tight">CODEXRS</div>
              <div className="text-[10px] text-[#d9a441] uppercase tracking-widest">Client command</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-[#9ba89d]">
            <span>HORECA ops</span>
            <span className="rounded-full bg-[#76c893]/12 px-2 py-0.5 text-[#9fe6b8]">Live</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_PRIMARY.map(item => <NavItem key={item.href} {...item} />)}

        <div className="pt-3 pb-1 px-3 text-[10px] uppercase tracking-widest text-[#667268] font-semibold">
          Travail
        </div>
        {NAV_WORK.map(item => <NavItem key={item.href} {...item} />)}

        <div className="pt-3 pb-1 px-3 text-[10px] uppercase tracking-widest text-[#667268] font-semibold">
          Système
        </div>
        {NAV_SYSTEM.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Profile */}
      <div className="px-3 py-3 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-white/[0.04] cursor-pointer transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d9a441] to-[#76c893] flex items-center justify-center text-xs font-bold text-[#11140f]">
            BD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#f5f1e8] truncate">Bradley Dave</div>
            <div className="text-[10px] text-[#7f8a81]">Agence interne</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
