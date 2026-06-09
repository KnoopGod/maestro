import type React from 'react'
import Link from 'next/link'
import { Users, Sparkles, CalendarDays, BarChart3, ArrowRight } from 'lucide-react'
import { listClientsWithStats } from '@/lib/db/queries/clients'
import { countPostsByStatus } from '@/lib/db/queries/posts'
import { SetupBanner } from '@/components/SetupBanner'
import { CLIENT_TYPES } from '@/types/client'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [clients, toValidate] = await Promise.all([
    listClientsWithStats(),
    countPostsByStatus(['draft', 'ready']),
  ])
  const activeClients = clients.filter(c => c.status === 'active')
  const totalPosts = clients.reduce((sum, c) => sum + c.postsThisMonth, 0)
  const avgEngagement = clients.length
    ? (clients.reduce((sum, c) => sum + c.engagement, 0) / clients.length).toFixed(1)
    : '0'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING'

  return (
    <div className="space-y-8">
      <SetupBanner />

      {/* Header */}
      <div className="border-b border-indigo-950/60 pb-5">
        <div className="text-[9px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-1">
          MAESTRO // DASHBOARD
        </div>
        <h1 className="text-2xl font-bold text-[#E0E3FF] tracking-wide">
          {greeting}, BRADLEY <span className="text-indigo-400">_</span>
        </h1>
        <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-wider">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
        </p>
      </div>

      {/* Stats */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-[8px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-3">{'// OVERVIEW'}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="CLIENTS ACTIFS"   value={activeClients.length} icon={Users}       accent="text-indigo-400"  sub={`${clients.length} TOTAL`} />
          <StatCard label="POSTS CE MOIS"    value={totalPosts}            icon={Sparkles}    accent="text-pink-400"    sub="TOUS CLIENTS" />
          <StatCard label="ENGAGEMENT MOY."  value={`${avgEngagement}%`}   icon={BarChart3}   accent="text-emerald-400" sub="VS 2.1% INDUSTRIE" />
          <StatCard label="À VALIDER"        value={toValidate}            icon={CalendarDays} accent="text-amber-400"  sub={toValidate === 0 ? 'FILE VIDE' : `${toValidate} POST${toValidate > 1 ? 'S' : ''}`} />
        </div>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="text-[8px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-3">{'// ACTIONS RAPIDES'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/studio"
            className="hud-corners group bg-gray-900/60 border border-gray-800 hover:border-indigo-600/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-200 p-6"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-600/40 flex items-center justify-center">
                <Sparkles aria-hidden="true" className="w-5 h-5 text-indigo-400" />
              </div>
              <ArrowRight aria-hidden="true" className="w-4 h-4 text-indigo-600/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-[8px] text-indigo-600/50 font-mono tracking-[0.25em] uppercase mb-1">MODULE 01 //</div>
            <h3 className="text-base font-bold text-[#E0E3FF] tracking-wide uppercase">Créer un Post</h3>
            <p className="text-[11px] text-gray-500 font-mono mt-1.5 leading-relaxed">
              Texte · image · vidéo — agents IA spécialisés
            </p>
          </Link>

          <Link
            href="/clients"
            className="hud-corners group bg-gray-900/60 border border-gray-800 hover:border-indigo-600/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-200 p-6"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-600/40 flex items-center justify-center">
                <Users aria-hidden="true" className="w-5 h-5 text-indigo-400" />
              </div>
              <ArrowRight aria-hidden="true" className="w-4 h-4 text-indigo-600/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-[8px] text-indigo-600/50 font-mono tracking-[0.25em] uppercase mb-1">MODULE 02 //</div>
            <h3 className="text-base font-bold text-[#E0E3FF] tracking-wide uppercase">Gérer les Clients</h3>
            <p className="text-[11px] text-gray-500 font-mono mt-1.5 leading-relaxed">
              {clients.length} clients HORECA — stratégies · performances
            </p>
          </Link>
        </div>
      </section>

      {/* Recent clients */}
      <section aria-labelledby="clients-heading">
        <div className="border border-gray-800 bg-gray-900/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 id="clients-heading" className="text-[8px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase">{'// CLIENTS ENREGISTRÉS'}</h2>
            <Link href="/clients" className="text-[9px] text-indigo-500 hover:text-indigo-300 font-mono tracking-wider transition-colors">
              VOIR TOUT ({clients.length}) →
            </Link>
          </div>
          {clients.length === 0 ? (
            <p className="text-[11px] text-gray-600 font-mono text-center py-6">AUCUN CLIENT ENREGISTRÉ</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {clients.slice(0, 6).map(c => {
                const typeCfg = CLIENT_TYPES[c.type]
                return (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="flex items-center gap-3 p-3 border border-gray-800 hover:border-indigo-700/50 transition-all group"
                  >
                    <div className={`w-9 h-9 bg-gradient-to-br ${c.color} flex items-center justify-center text-base flex-shrink-0`}>
                      {c.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[#E0E3FF] truncate group-hover:text-indigo-300 transition-colors font-mono tracking-wide uppercase">{c.name}</div>
                      <div className="text-[9px] text-gray-600 font-mono truncate">
                        {typeCfg?.label ?? ''}{c.city ? ` // ${c.city}` : ''}
                      </div>
                    </div>
                    <span className="text-[9px] text-indigo-700/60 font-mono">►</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, accent, sub,
}: {
  label: string; value: string | number; icon: React.ElementType; accent: string; sub: string
}) {
  return (
    <div className="hud-corners bg-gray-900/60 border border-gray-800 hover:border-indigo-700/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.1)] transition-all duration-200 p-4 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[8px] text-indigo-600/50 font-mono tracking-[0.2em] uppercase">{label}</span>
        <Icon aria-hidden="true" className={`w-3.5 h-3.5 ${accent} group-hover:scale-110 transition-transform duration-200`} />
      </div>
      <div className="text-2xl lg:text-3xl font-bold text-[#E0E3FF] font-mono">{value}</div>
      <div className="text-[8px] text-gray-600 font-mono tracking-[0.15em] mt-1.5">{sub}</div>
    </div>
  )
}
