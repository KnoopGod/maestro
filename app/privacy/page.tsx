import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — CODEXRS',
  description: 'Politique de confidentialité de l’application CODEXRS.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-purple-400">CODEXRS</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : 12 juin 2026</p>
      </div>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 text-sm leading-relaxed text-gray-300">
        <p>
          CODEXRS est un outil interne de gestion de contenus sociaux pour des clients HORECA.
          L’application aide à préparer, valider, planifier et publier des posts sur Facebook et Instagram via les API Meta.
        </p>
      </section>

      <LegalSection title="Données traitées">
        <p>
          L’application peut traiter les informations nécessaires à la gestion des comptes sociaux des clients :
          nom de l’établissement, ville, stratégie de communication, ressources visuelles fournies, identifiants de pages Meta,
          contenus de posts, dates de publication et métriques de performance disponibles via Meta.
        </p>
      </LegalSection>

      <LegalSection title="Utilisation des données">
        <p>
          Ces données sont utilisées uniquement pour fournir le service de communication : création de contenu,
          validation, publication, suivi des performances et amélioration des prochaines recommandations.
        </p>
      </LegalSection>

      <LegalSection title="Partage avec des services externes">
        <p>
          Certaines données peuvent être transmises aux services connectés nécessaires au fonctionnement de l’outil,
          notamment Meta pour publier sur Facebook et Instagram, ainsi qu’aux fournisseurs IA configurés pour générer
          ou améliorer les contenus.
        </p>
      </LegalSection>

      <LegalSection title="Conservation et suppression">
        <p>
          Les données sont conservées tant qu’elles sont nécessaires à la gestion du client ou jusqu’à demande de suppression.
          Une demande de suppression peut être envoyée via la page dédiée : <a className="text-purple-300 hover:underline" href="/data-deletion">Suppression des données</a>.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question relative aux données ou à la confidentialité, contactez l’administrateur de CODEXRS.
        </p>
      </LegalSection>
    </div>
  )
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
      <h2 className="mb-2 text-sm font-semibold text-white">{title}</h2>
      <div className="text-sm leading-relaxed text-gray-300">{children}</div>
    </section>
  )
}
