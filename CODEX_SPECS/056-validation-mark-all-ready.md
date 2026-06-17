# Spec 056 — Validation Mark All Ready Button

## Objectif
Ajouter un bouton "Tout marquer prêt" dans la page de validation quand il y a des
posts en `draft`, pour passer tous les brouillons en `ready` en un clic sans avoir
à sélectionner post par post.

## Comportement

### Bouton
- Visible uniquement si `draftCount > 0`
- Texte : "Marquer {n} prêts" (ex: "Marquer 5 prêts")
- Appelle `POST /api/posts/bulk` avec `{ ids: draftIds, action: 'mark-ready' }`
- Après succès : `router.refresh()`
- Placement : à côté du bouton "Nouveau post" dans le header de la page

## Fichiers créés / modifiés
- `components/posts/MarkAllReadyButton.tsx` (créé)
- `app/validation/page.tsx` — import + rendu dans le header
