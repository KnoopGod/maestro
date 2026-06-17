import type React from 'react'
import Link from 'next/link'
import { Users, Sparkles, CalendarDays, BarChart3, ArrowRight } from 'lucide-react'
import { listClientsWithStats, listClients } from '@/lib/db/queries/clients'
import { countPostsByStatus, listUpcomingPosts, listRecentlyFailedPosts, listPostsWithRecentPortalFeedback } from '@/lib/db/queries/posts'
import { listExpiringTokens } from '@/lib/db/queries/social-accounts'
import { SetupBanner } from '@/components/SetupBanner'
import { TokenExpiryBanner } from '@/components/TokenExpiryBanner'
import { FailedPostsAlert } from '@/components/dashboard/FailedPostsAlert'
import { PortalFeedbackAlert } from '@/components/dashboard/PortalFeedbackAlert'
import { TodayScheduleWidget } from '@/components/dashboard/TodayScheduleWidget'
import { CLIENT_TYPES } from '@/types/client'
import type { Client } from '@/types/client'

function healthDot(days: number | null): string {
  if (days === null) return 'bg-gray-700'
  if (days <= 3) return 'bg-emerald-500'
  if (days <= 7) return 'bg-amber-400'
  return 'bg-red-500'
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let clients: Awaited<ReturnType<typeof listClientsWithStats>> = []
  let toValidate = 0
  let expiringTokens: Awaited<ReturnType<typeof listExpiringTokens>> = []
  let todayPosts: Awaited<ReturnType<typeof listUpcomingPosts>> = []
  let allClients: Client[] = []
  let failedPosts: Awaited<ReturnType<typeof listRecentlyFailedPosts>> = []
  let portalFeedbackPosts: Awaited<ReturnType<typeof listPostsWithRecentPortalFeedback>> = []
  try {
    ;[clients, toValidate, expiringTokens, todayPosts, allClients, failedPosts, portalFeedbackPosts] = await Promise.all([
      listClientsWithStats(),
      countPostsByStatus(['draft', 'ready']),
      listExpiringTokens(14),
      listUpcomingPosts(),
      listClients(),
      listRecentlyFailedPosts(),
      listPostsWithRecentPortalFeedback(),
    ])
  } catch (err) {
    console.error('[HomePage] DB error:', err)
    // Continue with empty data — the SetupBanner will indicate DB misconfiguration
  }
  const clientsMap = new Map<string, Client>(allClients.map(c => [c.id, c]))
  const activeClients = clients.filter(c => c.status === 'active')
  const totalPosts = clients.reduce((sum, c) => sum + c.postsThisMonth, 0)
  const avgEngagement = clients.length
    ? (clients.reduce((sum, c) => sum + c.engagement, 0) / clients.length).toFixed(1)
    : '0'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING'

  const urgentClients = clients
    .filter(c => c.status === 'active' && (c.daysSincePost === null || c.daysSincePost > 7))
    .sort((a, b) => {
      if (a.daysSincePost === null) return -1
      if (b.daysSincePost === null) return 1
      return b.daysSincePost - a.daysSincePost
    })
    .slice(0, 3)

  return (
    <div className="space-y-8">
      <SetupBanner />
      <TokenExpiryBanner tokens={expiringTokens} />
      <FailedPostsAlert posts={failedPosts} />
      <PortalFeedbackAlert posts={portalFeedbackPosts} />

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
          <StatCard label="À VALIDER"        value={toValidate}            icon={CalendarDays} accent="text-amber-400"  sub={toValidate === 0 ? 'FILE VIDE' : `${toValidate} POST${toValidate > 1 ? 'S' : ''}`} href={toValidate > 0 ? '/validation' : undefined} urgent={toValidate > 0} />
        </div>
      </section>

      {/* Priorités du jour */}
      {clients.length > 0 && (
        <section aria-labelledby="priorities-heading">
          <h2 id="priorities-heading" className={`text-[8px] font-mono tracking-[0.3em] uppercase mb-3 ${urgentClients.length > 0 ? 'text-amber-500/70' : 'text-emerald-500/70'}`}>
            {'// PRIORITÉS DU JOUR'}
          </h2>
          {urgentClients.length === 0 ? (
            <div className="flex items-center gap-2.5 p-3 bg-emerald-950/20 border border-emerald-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-[11px] text-emerald-400/80 font-mono tracking-wide">Tous vos clients sont à jour — aucun retard de publication</span>
            </div>
          ) : (
            <div className="space-y-2">
              {urgentClients.map(c => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  title={`Ouvrir ${c.name} : client prioritaire à relancer`}
                  className="flex items-center gap-3 p-3 bg-amber-950/20 border border-amber-900/30 hover:border-amber-600/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.08)] transition-all group"
                >
                  <div className={`w-8 h-8 bg-gradient-to-br ${c.color} flex items-center justify-center text-sm flex-shrink-0`}>
                    {c.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-[#E0E3FF] truncate font-mono tracking-wide uppercase">{c.name}</div>
                    <div className="text-[9px] text-amber-400/70 font-mono mt-0.5">
                      {c.daysSincePost === null ? '⚑ Jamais publié' : `⚑ ${c.daysSincePost}j sans post`}
                    </div>
                  </div>
                  <span className="text-[9px] text-amber-700/60 font-mono group-hover:text-amber-400 transition-colors flex-shrink-0">CRÉER →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Today's schedule */}
      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="text-[8px] text-blue-600/60 font-mono tracking-[0.3em] uppercase mb-3">
          {'// PLANIFIÉ AUJOURD\'HUI'}
        </h2>
        <TodayScheduleWidget posts={todayPosts} clientsMap={clientsMap} />
      </section>

      {/* Quick actions */}
      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="text-[8px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-3">{'// ACTIONS RAPIDES'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/studio"
            title="Ouvrir le Studio pour créer un post complet avec texte, visuel et score d'impact"
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
            title="Ouvrir la liste des clients, leurs stratégies, connexions et bibliothèques"
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
            <Link href="/clients" title="Afficher tous les clients enregistrés" className="text-[9px] text-indigo-500 hover:text-indigo-300 font-mono tracking-wider transition-colors">
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
                    title={`Ouvrir la fiche de ${c.name}`}
                    className="flex items-center gap-3 p-3 border border-gray-800 hover:border-indigo-700/50 transition-all group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-9 h-9 bg-gradient-to-br ${c.color} flex items-center justify-center text-base`}>
                        {c.emoji}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-gray-900 ${healthDot(c.daysSincePost)}`} />
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
  label, value, icon: Icon, accent, sub, href, urgent,
}: {
  label: string; value: string | number; icon: React.ElementType; accent: string; sub: string; href?: string; urgent?: boolean
}) {
  const inner = (
    <div className={`hud-corners bg-gray-900/60 border transition-all duration-200 p-4 group ${
      urgent
        ? 'border-amber-800/50 hover:border-amber-600/60 hover:shadow-[0_0_16px_rgba(245,158,11,0.12)]'
        : 'border-gray-800 hover:border-indigo-700/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.1)]'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[8px] text-indigo-600/50 font-mono tracking-[0.2em] uppercase">{label}</span>
        <Icon aria-hidden="true" className={`w-3.5 h-3.5 ${accent} group-hover:scale-110 transition-transform duration-200`} />
      </div>
      <div className="text-2xl lg:text-3xl font-bold text-[#E0E3FF] font-mono">{value}</div>
      <div className={`text-[8px] font-mono tracking-[0.15em] mt-1.5 ${urgent ? 'text-amber-600/70' : 'text-gray-600'}`}>{sub}</div>
    </div>
  )
  return href ? <Link href={href} title="Ouvrir la file de validation des posts à relire">{inner}</Link> : inner
}
