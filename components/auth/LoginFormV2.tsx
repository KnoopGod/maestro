'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  next?: string
  error?: string
}

export default function LoginFormV2({ next, error: initialError }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError ?? null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/auth/login-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.push(next && next.startsWith('/') && !next.startsWith('//') ? next : '/')
      } else {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Erreur de connexion')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm border border-indigo-950/60 bg-gray-950/80 p-8 space-y-6 shadow-2xl shadow-indigo-950/30"
    >
      <div className="flex flex-col items-center gap-4 pb-2">
        <Image src="/logo.svg" alt="Maestro" width={72} height={72} priority />
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#E0E3FF] tracking-[0.2em] font-mono uppercase">MAESTRO</h1>
          <p className="text-[9px] text-indigo-500/60 font-mono tracking-[0.3em] mt-1">{'// AI CONDUCTOR'}</p>
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="text-[9px] uppercase tracking-[0.2em] text-indigo-600/60 font-mono">Email</span>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          required
          className="w-full border border-gray-800 bg-gray-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-600 font-mono"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[9px] uppercase tracking-[0.2em] text-indigo-600/60 font-mono">Mot de passe</span>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full border border-gray-800 bg-gray-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-600 font-mono"
        />
      </label>

      {error && (
        <p className="border border-red-800/50 bg-red-950/30 px-3 py-2 text-[10px] text-red-300 font-mono tracking-wider">
          ⚠ {error.toUpperCase()}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-indigo-600 px-4 py-2.5 text-[10px] font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors font-mono tracking-[0.2em] uppercase"
      >
        {isPending ? 'CONNEXION…' : 'ACCÉDER AU COCKPIT →'}
      </button>
    </form>
  )
}
