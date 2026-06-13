'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Rafraîchit le Server Component parent à intervalle régulier via router.refresh().
 * Ne poll que lorsque `active` est vrai (typiquement : un job est en cours), pour
 * éviter des re-rendus serveur inutiles quand il n'y a aucune activité.
 */
export function AutoRefresh({ active, intervalMs = 3000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, active, intervalMs])

  return null
}
