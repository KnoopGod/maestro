# Audit UX — MAESTRO

**Date** : 2026-06-13
**Statut** : Initial (Phase 0)
**Auditeur** : Claude Code (analyse statique du code)

> Note : Cet audit est basé sur l'analyse du code source. Aucun test utilisateur n'a été conduit. Un audit avec utilisateurs réels (cible : responsable communication, non-développeur) est recommandé avant la V2.

---

## Score global : 6/10

| Domaine | Score | Commentaire |
|---------|-------|-------------|
| Navigation | 7/10 | Sidebar claire, BottomNav mobile présent |
| États de page | 5/10 | États vides et loading incomplets |
| Formulaires | 6/10 | Validation présente mais hétérogène |
| Accessibilité | 4/10 | aria-labels manquants sur icônes |
| Erreurs | 5/10 | Messages parfois techniques |
| Mobile | 6/10 | BottomNav présent, tableaux non adaptés |

---

## Points positifs

- Navigation principale claire avec Sidebar (desktop) et BottomNav (mobile)
- `EmptyState` composant utilisé sur plusieurs pages
- `SubmitButton` avec `useFormStatus` — feedback visuel pendant soumission
- `StatusDot` pour les statuts de publication — visuellement clair
- `PublishErrorHint` offre des actions correctives sur erreur Meta
- Interface en français — accessible pour la cible HORECA

---

## Problèmes bloquants

### UX-B1 : Aucun feedback de progression pendant la génération (~60s)
**Page** : `/studio` (`StudioForm.tsx`)
**Impact** : L'utilisateur ne sait pas si l'application a planté ou travaille. Il peut cliquer à nouveau ou fermer l'onglet, perdant la génération.
**Solution** : Afficher un stepper (Account Director → Social Expert → Image → Supervision) mis à jour en temps réel.
**Fichier** : `components/studio/StudioForm.tsx`

### UX-B2 : Validation page — aucun indicateur du nombre de posts en attente
**Page** : `/validation`
**Impact** : L'utilisateur ne sait pas combien de posts l'attendent sans naviguer vers la page.
**Solution** : Badge de comptage dans la Sidebar sur le lien "Validation".
**Fichier** : `components/layout/Sidebar.tsx`

---

## Problèmes importants

### UX-I1 : États vides non implémentés sur plusieurs pages
**Pages concernées** : `/analytics`, `/calendar`, `/usage`, `/agents`
**Impact** : L'utilisateur voit une page blanche sans explication ni action suggérée.
**Solution** : Ajouter `EmptyState` avec message contextuel et CTA sur chaque page.

### UX-I2 : Jargon technique dans l'UI
**Occurrences** : "DA" (Direction Artistique), "Supervisor verdict", "agent_jobs"
**Impact** : Confus pour un utilisateur non-technique.
**Solution** : Remplacer ou ajouter un tooltip explicatif sur chaque terme.

### UX-I3 : Formulaire StudioForm — champs sans labels visibles
**Fichier** : `components/studio/StudioForm.tsx`
**Impact** : Accessibilité réduite, confusion sur certains champs.
**Solution** : Ajouter `<label htmlFor>` explicites sur tous les inputs.

### UX-I4 : Pas de confirmation avant suppression d'un client
**Fichier** : `components/clients/DeleteClientButton.tsx`
**Impact** : Suppression accidentelle possible — action irréversible.
**Solution** : Dialog de confirmation avec nom du client à saisir.

### UX-I5 : Tableaux non responsives
**Pages** : `/validation`, `/agents`, `/clients/[id]/analytics`
**Impact** : Sur mobile, les colonnes débordent horizontalement.
**Solution** : Utiliser des layouts cards sur mobile, tableaux sur desktop.

---

## Améliorations recommandées

| # | Amélioration | Priorité | Effort |
|---|-------------|---------|--------|
| A1 | Barre de progression génération (UX-B1) | Haute | 2j |
| A2 | Badge compteur dans Sidebar | Haute | 0.5j |
| A3 | États vides sur toutes les pages | Moyenne | 1j |
| A4 | Glossaire inline / tooltips (DA, etc.) | Moyenne | 0.5j |
| A5 | Confirmation suppression avec nom | Haute | 0.5j |
| A6 | Tables responsives → cards sur mobile | Basse | 2j |
| A7 | `loading.tsx` sur les pages lentes | Moyenne | 0.5j |
| A8 | aria-labels sur toutes les icônes sans texte | Haute | 1j |

---

## Prochaine étape recommandée

Traiter UX-B1 (feedback de progression) en Phase 4 (pipeline asynchrone) — les deux problèmes sont liés.
Traiter UX-B2 et A5 (compteur + confirmation suppression) dès la Phase 1 car effort minimal.
