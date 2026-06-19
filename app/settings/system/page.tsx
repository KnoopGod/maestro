import Link from 'next/link'
import { ArrowLeft, Database, ShieldCheck } from 'lucide-react'
import { RunMigrationsButton } from '@/components/settings/RunMigrationsButton'

export const dynamic = 'force-dynamic'

export default function SystemSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300">
        <ArrowLeft className="h-4 w-4" />
        Retour paramètres
      </Link>

      <div className="border-b border-indigo-950/60 pb-5">
        <div className="mb-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-indigo-600/50">
          <Database className="h-3 w-3" />
          MAESTRO // SYSTEM
        </div>
        <h1 className="text-2xl font-bold tracking-wide text-[#E0E3FF]">SYSTÈME</h1>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">
          Maintenance · base de données · vérifications production
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/15 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
          <p className="text-sm leading-relaxed text-emerald-100/80">
            Cette page sert au pilotage interne. Elle ne montre aucun secret et lance uniquement des opérations prévues par le code de l&apos;application.
          </p>
        </div>
      </div>

      <RunMigrationsButton />
    </div>
  )
}
