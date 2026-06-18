# Spec 133 — Post detail : lien rapide "File de validation"

## Objectif
Ajouter un lien rapide vers la file de validation filtrée par client dans le panneau de droite du post detail, affiché uniquement quand le post est dans la file (draft, ready, failed).

## Comportement

### Avant
- Quick links : Fiche client · Plan client · Dupliquer
- Pas de raccourci vers la validation depuis le post detail

### Après
- Quick links : Fiche client · Plan client · **File de validation** (conditionnel) · Dupliquer
- "File de validation" → `/validation?client={clientId}`
- Affiché uniquement si `status === 'draft' || 'ready' || 'failed'`
- Cohérent avec la règle de la file de validation

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — import `ShieldCheck`, lien conditionnel ajouté
