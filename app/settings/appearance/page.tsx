import Link from 'next/link'
import { ArrowLeft, Palette, Sparkles } from 'lucide-react'
import { ThemeAccentPicker } from '@/components/theme/ThemeAccentPicker'

export const dynamic = 'force-dynamic'

export default function AppearanceSettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300">
        <ArrowLeft className="h-4 w-4" />
        Retour paramètres
      </Link>

      <header className="border-b border-indigo-950/60 pb-5">
        <div className="mb-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-indigo-600/50">
          <Palette className="h-3 w-3" />
          MAESTRO // APPARENCE
        </div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-wide text-[#E0E3FF]">
          Couleur de l’interface
        </h1>
        <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-gray-500">
          Choisis l’accent visuel de Maestro. Le réglage est personnel à ton navigateur et s’applique immédiatement à l’interface.
        </p>
      </header>

      <section className="hud-corners border border-gray-800 bg-gray-900/45 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 theme-accent-text" />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#E0E3FF]">Accent principal</h2>
            <p className="mt-1 text-[10px] text-gray-500">Fond, focus clavier, détails HUD et futurs composants personnalisés.</p>
          </div>
        </div>
        <ThemeAccentPicker />
      </section>
    </div>
  )
}
