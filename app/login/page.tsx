import Image from 'next/image'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const { error, next } = await searchParams

  return (
    <main className="min-h-screen bg-[#07080d] text-white flex items-center justify-center px-4">
      <form
        action="/api/auth/login"
        method="post"
        className="w-full max-w-sm border border-indigo-950/60 bg-gray-950/80 p-8 space-y-6 shadow-2xl shadow-indigo-950/30"
      >
        <div className="flex flex-col items-center gap-4 pb-2">
          <Image src="/logo.svg" alt="Maestro" width={72} height={72} priority />
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#E0E3FF] tracking-[0.2em] font-mono uppercase">MAESTRO</h1>
            <p className="text-[9px] text-indigo-500/60 font-mono tracking-[0.3em] mt-1">// AI CONDUCTOR</p>
          </div>
        </div>

        {next && <input type="hidden" name="next" value={next} />}

        <label className="block space-y-1.5">
          <span className="text-[9px] uppercase tracking-[0.2em] text-indigo-600/60 font-mono">Mot de passe</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            className="w-full border border-gray-800 bg-gray-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-600 font-mono"
          />
        </label>

        {error && (
          <p className="border border-red-800/50 bg-red-950/30 px-3 py-2 text-[10px] text-red-300 font-mono tracking-wider">
            ⚠ MOT DE PASSE INCORRECT
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-indigo-600 px-4 py-2.5 text-[10px] font-bold text-white hover:bg-indigo-500 transition-colors font-mono tracking-[0.2em] uppercase"
        >
          ACCÉDER AU COCKPIT →
        </button>
      </form>
    </main>
  )
}
