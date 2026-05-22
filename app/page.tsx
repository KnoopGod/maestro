import Link from 'next/link'
import { Users, Sparkles, CalendarDays, BarChart3, ArrowRight } from 'lucide-react'
import { listClientsWithStats } from '@/lib/db/queries/clients'

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{greeting} Bradley 👋</h1>
        <p className="text-gray-400 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Clients actifs"
          value={activeClients.length}
          icon={Users}
          color="from-purple-950/40"
          accent="text-purple-300"
          border="border-purple-800/30"
          sub={`${clients.length} au total`}
        />
        <StatCard
          label="Posts ce mois"
          value={totalPosts}
          icon={Sparkles}
          color="from-pink-950/40"
          accent="text-pink-300"
          border="border-pink-800/30"
          sub="Tous clients confondus"
        />
        <StatCard
          label="Engagement moyen"
          value={`${avgEngagement}%`}
          icon={BarChart3}
          color="from-emerald-950/40"
          accent="text-emerald-300"
          border="border-emerald-800/30"
          sub="vs 2.1% industrie"
        />
        <StatCard
          label="À valider"
          value={0}
          icon={CalendarDays}
          color="from-amber-950/40"
          accent="text-amber-300"
          border="border-amber-800/30"
          sub="Aucun post en attente"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/studio"
          className="group bg-gradient-to-br from-purple-950/40 to-pink-950/30 border border-purple-700/30 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl shadow-lg">
              ✨
            </div>
            <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-lg font-semibold text-white">Créer un post</h3>
          <p className="text-sm text-gray-400 mt-1">
            Texte, image, vidéo — générés par tes agents spécialisés
          </p>
        </Link>

        <Link
          href="/clients"
          className="group bg-gradient-to-br from-blue-950/40 to-cyan-950/30 border border-blue-700/30 rounded-2xl p-6 hover:border-blue-500/50 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-2xl shadow-lg">
              👥
            </div>
            <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-lg font-semibold text-white">Gérer mes clients</h3>
          <p className="text-sm text-gray-400 mt-1">
            {clients.length} clients HORECA — voir leurs stratégies et performances
          </p>
        </Link>
      </div>

      {/* Recent clients */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">📋 Tes clients</h2>
          <Link href="/clients" className="text-sm text-purple-400 hover:underline">
            Voir tous ({clients.length}) →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {clients.slice(0, 6).map(c => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-950/40 border border-gray-800 hover:border-purple-700/50 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-lg flex-shrink-0`}>
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{c.name}</div>
                <div className="text-[11px] text-gray-500">
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
  label, value, icon: Icon, color, accent, border, sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  accent: string
  border: string
  sub: string
}) {
  return (
    <div className={`bg-gradient-to-br ${color} to-gray-900/40 border ${border} rounded-xl p-5 hover:border-opacity-50 transition-colors`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${accent}`}>{label}</span>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-gray-500 mt-1">{sub}</div>
    </div>
  )
}
