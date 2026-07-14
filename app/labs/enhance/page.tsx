import Link from 'next/link'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import { EnhanceLab } from '@/components/labs/EnhanceLab'

export const dynamic = 'force-dynamic'

/**
 * Labo retouche photo — POC de validation avant Snap Studio (spec 142).
 * Page interne agence (protégée par le middleware). À tester depuis un téléphone
 * avec de vraies photos de plats prises dans de vraies conditions.
 */
export default function EnhanceLabPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
        Retour au dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-purple-400" />
          Labo retouche
          <span className="text-[11px] bg-amber-600/30 text-amber-300 border border-amber-700/40 rounded-full px-2 py-1">POC SNAP STUDIO</span>
        </h1>
        <p className="text-gray-400 mt-1">
          Valide le moteur de retouche sur de vraies photos de plats avant de construire l&apos;expérience client.
          La règle : sublimer sans dénaturer — le plat doit rester exactement le plat.
        </p>
      </div>

      <EnhanceLab />
    </div>
  )
}
