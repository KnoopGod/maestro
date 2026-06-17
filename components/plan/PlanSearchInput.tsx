'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

export function PlanSearchInput({ initialQ, basePath = '/plan' }: { initialQ?: string; basePath?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialQ ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) {
        params.set('q', q.trim())
      } else {
        params.delete('q')
      }
      router.push(`${basePath}?${params.toString()}`)
    },
    [router, searchParams, basePath]
  )

  useEffect(() => {
    if (value === (initialQ ?? '')) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => push(value), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, initialQ, push])

  return (
    <div className="relative flex-1 min-w-0 max-w-xs">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Rechercher caption, brief…"
        className="w-full pl-8 pr-7 py-1.5 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => { setValue(''); push('') }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          aria-label="Effacer la recherche"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
