'use client'
import { Search, Bell, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function TopBar() {
  const router = useRouter()

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-[#07081A]/95 backdrop-blur-xl border-b border-indigo-950/60 flex items-center px-4 lg:px-6 z-30">
      {/* Left label */}
      <div className="hidden lg:flex items-center gap-2 mr-6 flex-shrink-0">
        <span className="text-[9px] text-indigo-600/50 font-mono tracking-[0.25em] uppercase">CONSOLE //</span>
      </div>

      {/* Search */}
      <form role="search" onSubmit={handleSearch} className="flex-1 max-w-sm relative">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-700/50 pointer-events-none" />
        <label htmlFor="topbar-search" className="sr-only">Rechercher</label>
        <input
          id="topbar-search"
          name="q"
          type="search"
          placeholder="SEARCH // CLIENT · POST · AGENT"
          className="w-full bg-indigo-950/20 border border-indigo-900/40 rounded-sm pl-9 pr-4 py-2 text-[11px] text-[#E0E3FF] placeholder:text-indigo-700/40 font-mono tracking-wider focus:outline-none focus:border-indigo-600/60 transition-colors"
        />
      </form>

      {/* Right */}
      <div className="ml-auto flex items-center gap-3">
        {/* System status */}
        <div className="hidden lg:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-indigo-600/50 font-mono tracking-widest">SYSTEM :: ONLINE</span>
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative w-8 h-8 min-w-[44px] min-h-[44px] border border-indigo-900/40 hover:border-indigo-600/60 flex items-center justify-center transition-colors"
        >
          <Bell aria-hidden="true" className="w-3.5 h-3.5 text-indigo-500/60" />
        </button>

        {/* CTA */}
        <Link
          href="/studio"
          className="px-3 py-1.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono tracking-[0.12em] uppercase transition-colors flex items-center gap-2 border border-indigo-500/40"
        >
          <Sparkles aria-hidden="true" className="w-3 h-3" />
          CRÉER
        </Link>
      </div>
    </header>
  )
}
