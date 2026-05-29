'use client'
import { Search, Bell, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function TopBar() {
  return (
    <header className="fixed top-3 left-3 lg:left-72 right-3 h-14 codexrs-panel rounded-2xl flex items-center px-4 lg:px-5 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667268]" />
        <input
          type="text"
          placeholder="Rechercher un client, un agent, un post..."
          className="w-full bg-black/20 border border-white/[0.08] rounded-xl pl-10 pr-16 py-2 text-sm text-[#f5f1e8] placeholder:text-[#667268] focus:outline-none focus:border-[#d9a441]/50 transition-colors"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#7f8a81] bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">⌘K</kbd>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-[#9ba89d]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#e56b6f]" />
        </button>

        <Link
          href="/studio"
          className="px-3 py-1.5 rounded-xl bg-[#d9a441] hover:bg-[#e5b85e] text-[#11140f] text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Créer
        </Link>
      </div>
    </header>
  )
}
