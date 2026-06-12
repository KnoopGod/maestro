import { LockKeyhole } from 'lucide-react'

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
        className="w-full max-w-sm border border-gray-800 bg-gray-950/80 rounded-2xl p-6 space-y-5 shadow-2xl shadow-purple-950/20"
      >
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-700/40 flex items-center justify-center">
            <LockKeyhole className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">CODEXRS</h1>
            <p className="text-sm text-gray-500 mt-1">Acces protege a ton cockpit interne.</p>
          </div>
        </div>

        {next && <input type="hidden" name="next" value={next} />}

        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-gray-500">Mot de passe</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            className="w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-600"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-red-800/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            Mot de passe incorrect.
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
        >
          Entrer
        </button>
      </form>
    </main>
  )
}
