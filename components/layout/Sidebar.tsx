'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Users, Sparkles, Bot, CalendarDays, BarChart3,
  FolderOpen, Plug, Settings, DollarSign, ShieldCheck,
} from 'lucide-react'

const NAV_PRIMARY = [
  { href: '/',           icon: Home,         label: 'Home',      seq: '01' },
]

const NAV_WORK = [
  { href: '/clients',    icon: Users,        label: 'Clients',    seq: '02', badge: null },
  { href: '/studio',     icon: Sparkles,     label: 'Studio',     seq: '03', badge: 'NEW' },
  { href: '/validation', icon: ShieldCheck,  label: 'Validation', seq: '04', badge: null },
  { href: '/calendar',   icon: CalendarDays, label: 'Calendrier', seq: '05', badge: null },
  { href: '/plan',       icon: CalendarDays, label: 'Historique', seq: '06', badge: null },
  { href: '/agents',     icon: Bot,          label: 'Agents',     seq: '07', badge: null },
  { href: '/analytics',  icon: BarChart3,    label: 'Analytics',  seq: '08', badge: null },
  { href: '/library',    icon: FolderOpen,   label: 'Library',    seq: '09', badge: null },
]

const NAV_SYSTEM = [
  { href: '/connections', icon: Plug,       label: 'Connexions', seq: '10', dot: true  },
  { href: '/usage',       icon: DollarSign, label: 'Usage',      seq: '11', dot: false },
  { href: '/settings',    icon: Settings,   label: 'Settings',   seq: '12', dot: false },
]

function NavItem({
  href, icon: Icon, label, seq, badge, dot,
}: {
  href: string; icon: React.ElementType; label: string; seq: string
  badge?: string | null; dot?: boolean
}) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 px-3 py-2 min-h-[40px] text-xs font-mono tracking-wider uppercase transition-all duration-150 group
        ${active
          ? 'border-l-2 border-indigo-400 bg-indigo-950/50 text-indigo-200 pl-2.5'
          : 'border-l-2 border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 hover:border-indigo-800/50'
        }`}
    >
      <span className={`text-[9px] font-mono flex-shrink-0 w-4 ${active ? 'text-indigo-500' : 'text-gray-700'}`}>{seq}</span>
      <Icon aria-hidden="true" className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-indigo-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
      <span className="flex-1 tracking-[0.08em]">{label}</span>
      {badge && (
        <span className="text-[8px] px-1.5 py-0.5 bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 font-mono tracking-widest">
          {badge}
        </span>
      )}
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
      {active && <span className="text-[9px] text-indigo-600 flex-shrink-0">&#9658;</span>}
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#07081A] border-r border-indigo-950/60 flex-col z-40">
      {/* Scan-line overlay */}
      <div className="absolute inset-0 pointer-events-none hud-scan" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-indigo-950/60">
        <div className="w-8 h-8 border border-indigo-600/50 flex items-center justify-center flex-shrink-0">
          <div className="w-5 h-5 border border-indigo-500/80 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-400 rounded-full" />
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-[#E0E3FF] tracking-[0.15em] font-mono uppercase">MAESTRO</div>
          <div className="text-[9px] text-indigo-500/70 tracking-[0.25em] font-mono">// AI CONDUCTOR</div>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Navigation principale" className="flex-1 py-3 overflow-y-auto">
        {NAV_PRIMARY.map(item => <NavItem key={item.href} {...item} />)}

        <p className="px-4 pt-4 pb-1.5 text-[8px] text-indigo-600/60 tracking-[0.3em] font-mono">// WORKFLOW</p>
        {NAV_WORK.map(item => <NavItem key={item.href} {...item} />)}

        <p className="px-4 pt-4 pb-1.5 text-[8px] text-indigo-600/60 tracking-[0.3em] font-mono">// SYSTÈME</p>
        {NAV_SYSTEM.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Status / Profile */}
      <div className="border-t border-indigo-950/60 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-indigo-500/60 font-mono tracking-widest">SESSION :: ACTIVE</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-[9px] font-bold text-white font-mono">
            BD
          </div>
          <div>
            <div className="text-[10px] text-[#E0E3FF] font-mono tracking-wide">BRADLEY DAVE</div>
            <div className="text-[8px] text-indigo-600/60 font-mono tracking-widest">PRO // PLAN</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
