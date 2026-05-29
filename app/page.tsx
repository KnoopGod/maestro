import Link from 'next/link'
import type { ElementType } from 'react'
import {
  Users, Sparkles, CalendarDays, BarChart3, ArrowRight,
  CheckCircle2, Layers3, Wand2, RadioTower,
} from 'lucide-react'
import { listClientsWithStats } from '@/lib/db/queries/clients'
import { SetupBanner } from '@/components/SetupBanner'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const clients = await listClientsWithStats()
  const activeClients = clients.filter(c => c.status === 'active')
  const totalPosts = clients.reduce((sum, c) => sum + c.postsThisMonth, 0)
  const avgEngagement = clients.length
    ? (clients.reduce((sum, c) => sum + c.engagement, 0) / clients.length).toFixed(1)
    : '0'

  // Current hour for greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="space-y-6">
      {/* Setup banner — disappears once all env vars are configured */}
      <SetupBanner />

      {/* Header */}
      <div className="codexrs-hero rounded-[28px] p-5 sm:p-7 lg:p-8 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-[#d9a441]/40 to-transparent lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="codexrs-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
              <RadioTower className="h-3.5 w-3.5" />
              Cockpit social HORECA
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-[#f5f1e8] sm:text-4xl lg:text-5xl">
              {greeting} Bradley, pilote tes clients depuis un seul poste de travail.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#aab5ac] sm:text-base">
              Stratégie, génération créative, validation, calendrier et publication Meta restent connectés au même flux opérationnel.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Client', 'Stratégie', 'Studio', 'Validation', 'Publication'].map(step => (
                <span key={step} className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-xs text-[#d6ded7]">
                  {step}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.28em] text-[#7f8a81]">Flux MVP</span>
              <span className="rounded-full bg-[#76c893]/12 px-2.5 py-1 text-xs font-medium text-[#9fe6b8]">Actif</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['Analyse client', 'Profil, DA, contexte et objectif'],
                ['Proposition agents', 'Texte + image IA pour Facebook et Instagram'],
                ['Validation humaine', 'Premier post contrôlé avant publication'],
              ].map(([title, detail]) => (
                <div key={title} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#76c893]" />
                  <div>
                    <div className="text-sm font-medium text-[#f5f1e8]">{title}</div>
                    <div className="text-xs text-[#8f9a91]">{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Clients actifs"
          value={activeClients.length}
          icon={Users}
          tone="gold"
          sub={`${clients.length} au total`}
        />
        <StatCard
          label="Posts ce mois"
          value={totalPosts}
          icon={Sparkles}
          tone="blue"
          sub="Tous clients confondus"
        />
        <StatCard
          label="Engagement moyen"
          value={`${avgEngagement}%`}
          icon={BarChart3}
          tone="green"
          sub="vs 2.1% industrie"
        />
        <StatCard
          label="À valider"
          value={0}
          icon={CalendarDays}
          tone="red"
          sub="Aucun post en attente"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/studio"
          className="codexrs-action group rounded-3xl p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#d9a441] flex items-center justify-center shadow-lg shadow-black/30">
              <Wand2 className="h-5 w-5 text-[#11140f]" />
            </div>
            <ArrowRight className="w-5 h-5 text-[#d9a441] group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-lg font-semibold text-[#f5f1e8]">Créer un post</h3>
          <p className="text-sm text-[#9ba89d] mt-1">
            Texte, image, vidéo — générés par tes agents spécialisés
          </p>
        </Link>

        <Link
          href="/clients"
          className="codexrs-action group rounded-3xl p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#76c893] flex items-center justify-center shadow-lg shadow-black/30">
              <Layers3 className="h-5 w-5 text-[#07110b]" />
            </div>
            <ArrowRight className="w-5 h-5 text-[#76c893] group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-lg font-semibold text-[#f5f1e8]">Gérer mes clients</h3>
          <p className="text-sm text-[#9ba89d] mt-1">
            {clients.length} clients HORECA — voir leurs stratégies et performances
          </p>
        </Link>
      </div>

      {/* Recent clients */}
      <div className="codexrs-panel rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f1e8]">Tes clients</h2>
          <Link href="/clients" className="text-sm text-[#d9a441] hover:underline">
            Voir tous ({clients.length}) →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clients.slice(0, 6).map(c => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/[0.07] hover:border-[#d9a441]/36 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-lg flex-shrink-0`}>
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#f5f1e8] truncate">{c.name}</div>
                <div className="text-[11px] text-[#7f8a81]">
                  {c.city || '—'} · {c.engagement}% engagement
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, tone, sub,
}: {
  label: string
  value: string | number
  icon: ElementType
  tone: 'gold' | 'blue' | 'green' | 'red'
  sub: string
}) {
  const tones = {
    gold: { accent: 'text-[#d9a441]', bg: 'bg-[#d9a441]/10', border: 'border-[#d9a441]/22' },
    blue: { accent: 'text-[#7db7d8]', bg: 'bg-[#7db7d8]/10', border: 'border-[#7db7d8]/22' },
    green: { accent: 'text-[#76c893]', bg: 'bg-[#76c893]/10', border: 'border-[#76c893]/22' },
    red: { accent: 'text-[#e56b6f]', bg: 'bg-[#e56b6f]/10', border: 'border-[#e56b6f]/22' },
  }[tone]

  return (
    <div className={`codexrs-panel rounded-2xl p-5 border ${tones.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${tones.accent}`}>{label}</span>
        <span className={`rounded-lg ${tones.bg} p-2`}>
          <Icon className={`w-4 h-4 ${tones.accent}`} />
        </span>
      </div>
      <div className="text-2xl lg:text-3xl font-bold text-[#f5f1e8]">{value}</div>
      <div className="text-xs text-[#7f8a81] mt-1">{sub}</div>
    </div>
  )
}
