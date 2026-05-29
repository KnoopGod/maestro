import Link from 'next/link'
import { Settings, User, CreditCard, Users, Palette, Shield, Code, Plug, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SECTIONS = [
  { icon: Plug,       title: 'Connexions API',  desc: 'Anthropic, OpenAI, Meta...',          color: 'text-purple-400',  href: '/social/settings/connections' },
  { icon: DollarSign, title: 'Usage & Coûts',   desc: 'Tokens, coûts par client, par mois',  color: 'text-emerald-400', href: '/usage' },
  { icon: User,       title: 'Profil & compte', desc: 'Email, mot de passe, préférences',   color: 'text-blue-400',   href: '#' },
  { icon: CreditCard, title: 'Facturation',     desc: 'Plan, paiement, factures',           color: 'text-emerald-400', href: '#' },
  { icon: Users,      title: 'Équipe',          desc: 'Inviter collaborateurs, permissions', color: 'text-amber-400',   href: '#' },
  { icon: Palette,    title: 'Apparence',       desc: 'Thème, langue, notifications',        color: 'text-pink-400',    href: '#' },
  { icon: Shield,     title: 'Sécurité',        desc: '2FA, sessions actives, audit log',    color: 'text-red-400',     href: '#' },
  { icon: Code,       title: 'API & Webhooks',  desc: 'Pour intégrations custom',            color: 'text-cyan-400',    href: '#' },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-gray-400" />
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Profil, équipe, facturation, intégrations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {SECTIONS.map(({ icon: Icon, title, desc, color, href }) => {
          const placeholder = href === '#'
          return (
            <Link
              key={title}
              href={href}
              className={`bg-gray-900/40 border border-gray-800 rounded-2xl p-5 hover:border-purple-700/50 transition-all ${
                placeholder ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <Icon className={`w-6 h-6 ${color} mb-2`} />
              <div className="font-semibold text-white">{title}</div>
              <div className="text-xs text-gray-500 mt-1">{desc}</div>
              {placeholder && (
                <div className="mt-2 text-[10px] uppercase tracking-wider text-gray-600">Bientôt</div>
              )}
            </Link>
          )
        })}
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 text-sm text-gray-400">
        <p>
          <strong className="text-white">Version CODEXRS :</strong> v0.3.0 — Sprint Post-Production
        </p>
        <p className="mt-1 text-xs text-gray-500">
          CODEXRS est en développement actif. Les sections marquées &laquo;Bientôt&raquo; seront disponibles dans les prochains sprints.
        </p>
      </div>
    </div>
  )
}
