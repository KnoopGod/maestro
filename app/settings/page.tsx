import Link from 'next/link'
import { Settings, User, CreditCard, Users, Palette, Shield, Code, Plug, DollarSign } from 'lucide-react'
import { WipOverlay } from '@/components/ui/WipTag'

export const dynamic = 'force-dynamic'

const SECTIONS = [
  { icon: Plug,       title: 'Connexions API',  desc: 'Anthropic, OpenAI, Meta...',          color: 'text-purple-400',  href: '/social/settings/connections', wip: false },
  { icon: DollarSign, title: 'Usage & Coûts',   desc: 'Tokens, coûts par client, par mois',  color: 'text-emerald-400', href: '/usage',                       wip: false },
  { icon: User,       title: 'Profil & compte', desc: 'Email, mot de passe, préférences',    color: 'text-blue-400',    href: process.env.NEXT_PUBLIC_MULTI_USER_MODE === 'true' ? '/settings/profile' : '#', wip: process.env.NEXT_PUBLIC_MULTI_USER_MODE !== 'true' },
  { icon: CreditCard, title: 'Facturation',     desc: 'Plan, paiement, factures',            color: 'text-emerald-400', href: '#',                            wip: true  },
  { icon: Users,      title: 'Équipe',          desc: 'Inviter collaborateurs, permissions', color: 'text-amber-400',   href: '/settings/team',               wip: false },
  { icon: Palette,    title: 'Apparence',       desc: 'Thème, langue, notifications',        color: 'text-pink-400',    href: '#',                            wip: true  },
  { icon: Shield,     title: 'Sécurité',        desc: 'Sessions actives, audit log',         color: 'text-red-400',     href: '/settings/audit',              wip: false },
  { icon: Code,       title: 'API & Webhooks',  desc: 'Pour intégrations custom',            color: 'text-cyan-400',    href: '#',                            wip: true  },
]

function SectionCard({ icon: Icon, title, desc, color, href }: Omit<typeof SECTIONS[0], 'wip'>) {
  return (
    <Link
      href={href}
      className="hud-corners block bg-gray-900/60 border border-gray-800 hover:border-indigo-700/50 transition-all p-5"
    >
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-sm font-semibold text-[#E0E3FF] font-mono tracking-wide uppercase">{title}</div>
      <div className="text-[10px] text-gray-500 font-mono mt-1 leading-relaxed">{desc}</div>
    </Link>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-indigo-950/60 pb-5">
        <div className="text-[9px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-1">MAESTRO // SETTINGS</div>
        <h1 className="text-2xl font-bold text-[#E0E3FF] flex items-center gap-2 tracking-wide">
          <Settings className="w-6 h-6 text-gray-500" />
          PARAMÈTRES
        </h1>
        <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-wider">Profil · équipe · facturation · intégrations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {SECTIONS.map(({ wip, ...s }) =>
          wip
            ? <WipOverlay key={s.title}><SectionCard {...s} /></WipOverlay>
            : <SectionCard key={s.title} {...s} />
        )}
      </div>

      <div className="border border-indigo-900/40 bg-gray-900/40 p-4">
        <div className="text-[8px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-1">{'// BUILD INFO'}</div>
        <p className="text-[11px] text-gray-400 font-mono">
          <span className="text-[#E0E3FF]">VERSION</span> :: v0.3.0 — Sprint Post-Production
        </p>
        <p className="text-[10px] text-gray-600 font-mono mt-1">
          Les modules marqués <span className="text-amber-500">{'// À VENIR'}</span> seront livrés dans les prochains sprints.
        </p>
      </div>
    </div>
  )
}
