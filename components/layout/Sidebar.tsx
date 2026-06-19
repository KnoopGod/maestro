'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home, Users, Sparkles, Bot, CalendarDays, BarChart3,
  FolderOpen, Plug, Settings, DollarSign, ShieldCheck,
  LogOut, Activity, BrainCircuit,
} from 'lucide-react'
import { WipTag } from '@/components/ui/WipTag'

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
  { href: '/production', icon: Activity,     label: 'Production', seq: '08', badge: 'LIVE' },
  { href: '/analytics',  icon: BarChart3,    label: 'Analytics',  seq: '09', badge: null },
  { href: '/library',    icon: FolderOpen,   label: 'Library',    seq: '10', badge: null },
]

const NAV_SYSTEM = [
  { href: '/connections', icon: Plug,       label: 'Connexions', seq: '11', dot: true  },
  { href: '/settings/ai', icon: BrainCircuit, label: 'IA SELECT', seq: '12', dot: false },
  { href: '/usage',       icon: DollarSign, label: 'Usage',      seq: '13', dot: false },
  { href: '/settings',    icon: Settings,   label: 'Settings',   seq: '14', dot: false },
]

function NavItem({
  href, icon: Icon, label, seq, badge, dot, count,
}: {
  href: string; icon: React.ElementType; label: string; seq: string
  badge?: string | null; dot?: boolean; count?: number
}) {
  const pathname = usePathname()
  const active = href === '/'
    ? pathname === '/'
    : href === '/settings'
      ? pathname === '/settings'
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      title={`${label} — ouvrir la section ${label}`}
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
      {count != null && count > 0 && (
        <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-amber-500 text-black rounded-full px-1 font-mono flex-shrink-0">
          {count > 99 ? '99+' : count}
        </span>
      )}
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
      {active && <span className="text-[9px] text-indigo-600 flex-shrink-0">&#9658;</span>}
    </Link>
  )
}

function LogoutButtonV2() {
  async function handleLogout() {
    await fetch('/api/auth/logout-v2', { method: 'POST' })
    window.location.href = '/login'
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      title="Fermer la session et revenir à la page de connexion"
      className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] text-gray-600 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-900/40 font-mono tracking-widest transition-colors"
    >
      <LogOut className="w-3 h-3" />
      DECONNEXION
    </button>
  )
}

export function Sidebar({ validationCount = 0 }: { validationCount?: number }) {
  const navWork = NAV_WORK.map(item =>
    item.href === '/validation' && validationCount > 0
      ? { ...item, count: validationCount }
      : item
  )

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#07081A] border-r border-indigo-950/60 flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-indigo-950/60">
        <Image src="/logo.svg" alt="Maestro" width={36} height={36} className="flex-shrink-0" priority />
        <div>
          <div className="text-xs font-bold text-[#E0E3FF] tracking-[0.15em] font-mono uppercase">MAESTRO</div>
          <div className="text-[9px] text-indigo-500/70 tracking-[0.25em] font-mono">{'// AI CONDUCTOR'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Navigation principale" className="flex-1 py-3 overflow-y-auto">
        {NAV_PRIMARY.map(item => <NavItem key={item.href} {...item} />)}

        <p className="px-4 pt-4 pb-1.5 text-[8px] text-indigo-600/60 tracking-[0.3em] font-mono">{'// WORKFLOW'}</p>
        {navWork.map(item => <NavItem key={item.href} {...item} />)}

        <p className="px-4 pt-4 pb-1.5 text-[8px] text-indigo-600/60 tracking-[0.3em] font-mono">{'// SYSTÈME'}</p>
        {NAV_SYSTEM.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Status / Profile — hardcoded placeholder */}
      <div className="border-t border-indigo-950/60 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2" title="Session administrateur active sur cette version test">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-indigo-500/60 font-mono tracking-widest">SESSION :: ACTIVE</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-[9px] font-bold text-white font-mono opacity-50">
            BD
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#E0E3FF]/50 font-mono tracking-wide truncate">BRADLEY DAVE</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] text-indigo-600/40 font-mono tracking-widest">PRO // PLAN</span>
              <WipTag label="MOCK" />
            </div>
          </div>
        </div>
        {process.env.NEXT_PUBLIC_MULTI_USER_MODE === 'true' ? (
          <LogoutButtonV2 />
        ) : (
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              title="Fermer la session et revenir à la page de connexion"
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] text-gray-600 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-900/40 font-mono tracking-widest transition-colors"
            >
              <LogOut className="w-3 h-3" />
              DECONNEXION
            </button>
          </form>
        )}
      </div>
    </aside>
  )
}
