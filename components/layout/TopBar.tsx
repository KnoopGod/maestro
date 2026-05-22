'use client'
import { Search, Bell, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function TopBar() {
  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 flex items-center px-6 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Rechercher un client, un agent, un post..."
          className="w-full bg-gray-900/50 border border-gray-800 rounded-lg pl-10 pr-16 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-gray-800/50 border border-gray-700 rounded px-1.5 py-0.5">⌘K</kbd>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-lg hover:bg-gray-800/60 flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500" />
        </button>

        <Link
          href="/studio"
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Créer
        </Link>
      </div>
    </header>
  )
}
