import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Suppression des données — CODEXRS',
  description: 'Instructions de suppression des données utilisateur pour CODEXRS.',
}

export default function DataDeletionPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-purple-400">CODEXRS</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Suppression des données utilisateur</h1>
        <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : 12 juin 2026</p>
      </div>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 text-sm leading-relaxed text-gray-300">
        <p>
          Cette page explique comment demander la suppression des données associées à l’utilisation de CODEXRS
          et aux connexions Meta utilisées pour Facebook et Instagram.
        </p>
      </section>

      <DeletionStep title="1. Envoyer une demande">
        <p>
          Envoyez une demande à l’administrateur de CODEXRS en indiquant le nom de l’établissement concerné,
          la Page Facebook ou le compte Instagram associé, et les données à supprimer.
        </p>
      </DeletionStep>

      <DeletionStep title="2. Vérification">
        <p>
          L’administrateur vérifie que la demande concerne bien un client ou un compte connecté à CODEXRS.
          Cette vérification évite la suppression accidentelle de données d’un autre client.
        </p>
      </DeletionStep>

      <DeletionStep title="3. Suppression">
        <p>
          Les connexions Meta, tokens d’accès, contenus, ressources et historiques associés peuvent être supprimés
          depuis l’interface d’administration ou directement dans la base de données si nécessaire.
        </p>
      </DeletionStep>

      <DeletionStep title="4. Confirmation">
        <p>
          Une confirmation est envoyée une fois la suppression effectuée. Les données supprimées ne sont plus utilisées
          par CODEXRS pour publier ou analyser du contenu.
        </p>
      </DeletionStep>

      <section className="rounded-2xl border border-purple-800/40 bg-purple-950/20 p-5">
        <h2 className="mb-2 text-sm font-semibold text-white">Révocation côté Meta</h2>
        <p className="text-sm leading-relaxed text-gray-300">
          Vous pouvez aussi révoquer l’accès depuis Facebook/Meta en retirant l’application depuis les paramètres
          de votre compte, de votre Page Facebook ou de Meta Business Suite.
        </p>
      </section>
    </div>
  )
}

function DeletionStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
      <h2 className="mb-2 text-sm font-semibold text-white">{title}</h2>
      <div className="text-sm leading-relaxed text-gray-300">{children}</div>
    </section>
  )
}
