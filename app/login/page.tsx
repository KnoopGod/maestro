'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const BOOT_LINES = [
  { text: '> MAESTRO SYSTEM :: BOOT v4.2.1', delay: 300, accent: false },
  { text: '> INITIALIZING AI CONDUCTOR...', delay: 700, accent: false },
  { text: '> AGENT REGISTRY LOADED ......... OK', delay: 1100, accent: false },
  { text: '> DATABASE CONNECTION ........... OK', delay: 1500, accent: false },
  { text: '> AUTHENTICATION MODULE ......... ACTIVE', delay: 1900, accent: false },
  { text: '> SOCIAL API ADAPTERS ........... STANDBY', delay: 2200, accent: false },
  { text: '> WELCOME, OPERATOR', delay: 2700, accent: true },
]

function LoginForm() {
  const searchParams = useSearchParams()
  const hasError = searchParams.get('error') === '1'
  const [bootLines, setBootLines] = useState<number[]>([])
  const [showForm, setShowForm] = useState(false)

  const completeBootSequence = useCallback(() => {
    setTimeout(() => setShowForm(true), 400)
  }, [])

  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setBootLines(prev => [...prev, i])
        if (i === BOOT_LINES.length - 1) completeBootSequence()
      }, line.delay)
    })
  }, [completeBootSequence])

  return (
    <div className="min-h-screen bg-[#07081A] flex items-center justify-center p-4"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.09) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Terminal boot panel */}
        <div className="border border-indigo-900/60 bg-gray-900/60 p-5 hud-corners">
          <div className="flex items-center gap-2 border-b border-indigo-950/60 pb-2 mb-4">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-2 h-2 rounded-full bg-amber-500/60" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
            </div>
            <span className="text-[9px] text-indigo-600/50 font-mono tracking-[0.2em] ml-2">TTY/0 :: FIELD-STATION // MAESTRO</span>
          </div>
          <div className="space-y-1.5 min-h-[140px]">
            {BOOT_LINES.map((line, i) => (
              <div key={i} className={`text-[11px] font-mono transition-all duration-300 ${
                bootLines.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
              } ${line.accent ? 'text-indigo-400' : 'text-gray-500'}`}>
                {line.text}
                {bootLines.includes(i) && i === bootLines[bootLines.length - 1] && i < BOOT_LINES.length - 1 && (
                  <span className="cursor-blink text-indigo-400">_</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Login form — pure HTML POST, no JS auth logic */}
        <div className={`transition-all duration-500 ${showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="border border-indigo-900/60 bg-gray-900/60 p-6 hud-corners">
            <div className="text-[8px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-1">
              AUTHENTICATION REQUIRED
            </div>
            <h1 className="text-lg font-bold text-[#E0E3FF] font-mono tracking-wider uppercase mb-5">
              OPERATOR ACCESS
            </h1>

            <form method="POST" action="/api/auth/login" className="space-y-4">
              <div>
                <label htmlFor="login-password" className="block text-[8px] text-indigo-600/60 font-mono tracking-[0.25em] uppercase mb-1.5">
                  PASSPHRASE //
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  className="w-full bg-[#07081A] border border-indigo-900/60 focus:border-indigo-600/80 px-3 py-2.5 text-[11px] text-[#E0E3FF] font-mono tracking-wider placeholder:text-indigo-900/60 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>

              {hasError && (
                <p role="alert" className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/40 px-3 py-2 font-mono">
                  ✕ ACCESS DENIED — INVALID CREDENTIALS
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[11px] tracking-[0.2em] uppercase py-2.5 transition-colors flex items-center justify-center gap-2 border border-indigo-500/40"
              >
                AUTHENTICATE ►
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[8px] text-indigo-900/60 font-mono tracking-widest">
          MAESTRO // CRAFTED FOR HORECA OPERATORS
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
