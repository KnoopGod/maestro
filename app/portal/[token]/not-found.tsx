export default function PortalNotFound() {
  return (
    <main className="min-h-screen bg-[#07080d] text-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-lg font-bold text-[#E0E3FF] tracking-[0.2em] font-mono uppercase">Lien invalide</h1>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">
          Ce lien n&apos;est plus valide ou a expiré. Contactez votre agence pour obtenir un nouvel accès.
        </p>
      </div>
    </main>
  )
}
