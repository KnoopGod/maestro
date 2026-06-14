'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@/lib/db/queries/users'

export function UserToggle({ user }: { user: User }) {
  const router = useRouter()
  const [active, setActive] = useState(user.active)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    if (res.ok) {
      setActive(prev => !prev)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      title={active ? 'Désactiver ce compte' : 'Réactiver ce compte'}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 ${
        active ? 'bg-emerald-600' : 'bg-gray-700'
      }`}
    >
      <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
        active ? 'translate-x-5' : 'translate-x-1'
      }`} />
    </button>
  )
}
