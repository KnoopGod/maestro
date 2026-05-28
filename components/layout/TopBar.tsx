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
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 flex items-center px-4 lg:px-6 z-30">
      {/* Search */}
      <form role="search" onSubmit={handleSearch} className="flex-1 max-w-md relative">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <label htmlFor="topbar-search" className="sr-only">
          Rechercher un client, un agent ou un post
        </label>
        <input
          id="topbar-search"
          name="q"
          type="search"
          placeholder="Rechercher un client, un post..."
          aria-label="Rechercher un client, un agent ou un post"
          className="w-full bg-gray-900/50 border border-gray-800 rounded-lg pl-10 pr-16 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <kbd aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-gray-800/50 border border-gray-700 rounded px-1.5 py-0.5">↵</kbd>
      </form>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="relative w-9 h-9 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-800/60 flex items-center justify-center transition-colors"
        >
          <Bell aria-hidden="true" className="w-4 h-4 text-gray-400" />
        </button>

        <Link
          href="/studio"
          className="px-3 py-1.5 min-h-[44px] rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Sparkles aria-hidden="true" className="w-3.5 h-3.5" />
          Créer
        </Link>
      </div>
    </header>
  )
}
