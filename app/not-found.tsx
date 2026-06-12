import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="text-[9px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-4">
          {'// 404 NOT FOUND'}
        </div>
        <h2 className="text-4xl font-bold text-[#E0E3FF] font-mono mb-4">404</h2>
        <p className="text-[11px] text-gray-500 font-mono mb-8 leading-relaxed">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-600/40 text-indigo-400 text-[11px] font-mono hover:bg-indigo-600/30 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          ACCUEIL
        </Link>
      </div>
    </div>
  )
}
