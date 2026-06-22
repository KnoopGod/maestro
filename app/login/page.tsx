import Image from 'next/image'
import LoginFormV2 from '@/components/auth/LoginFormV2'
import { isMultiUserMode } from '@/lib/auth/mode'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const { error, next } = await searchParams
  const isV2 = isMultiUserMode()

  return (
    <main className="min-h-screen bg-[#07080d] text-white flex items-center justify-center px-4">
      {isV2 ? (
        <LoginFormV2 next={next} error={error} />
      ) : (
        <form
          action="/api/auth/login"
          method="post"
          className="w-full max-w-sm border border-indigo-950/60 bg-gray-950/80 p-8 space-y-6 shadow-2xl shadow-indigo-950/30 rounded-2xl"
        >
          <div className="flex flex-col items-center gap-4 pb-2">
            <Image src="/logo.svg" alt="Maestro" width={72} height={72} priority />
            <div className="text-center">
              <h1 className="text-xl font-bold text-[#E0E3FF] tracking-[0.2em] font-mono uppercase">MAESTRO</h1>
              <p className="text-[11px] text-indigo-500/60 font-mono tracking-[0.3em] mt-1">{'// AI CONDUCTOR'}</p>
            </div>
          </div>

          {next && <input type="hidden" name="next" value={next} />}

          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.2em] text-indigo-600/60 font-mono">Mot de passe</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              autoFocus
              className="w-full border border-gray-800 bg-gray-950/60 px-3 py-2.5 text-sm text-[#E0E3FF] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono rounded-lg transition-all duration-150 placeholder:text-gray-600"
            />
          </label>

          {error && (
            <p className="border border-red-800/50 bg-red-950/30 px-3 py-2 text-[11px] text-red-300 font-mono tracking-wider rounded-lg">
              ⚠ MOT DE PASSE INCORRECT
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] px-4 py-2.5 text-xs font-bold text-white transition-all duration-150 font-mono tracking-[0.2em] uppercase rounded-xl"
          >
            ACCÉDER AU COCKPIT →
          </button>
        </form>
      )}
    </main>
  )
}
