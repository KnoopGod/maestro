# Spec 134 — Studio batch : lien validation filtré par client après génération

## Objectif
Après une génération batch, les liens "Voir en Validation" et "Voir dans Validation" pointaient vers `/validation` sans filtre client, obligeant l'utilisateur à retrouver manuellement les posts générés dans la file complète.

## Comportement

### Avant
- Lien succès batch : `/validation`
- Lien succès par slot : `/validation`

### Après
- Lien succès batch : `/validation?client={clientId}`
- Lien succès par slot : `/validation?client={clientId}`
- Sans clientId (cas improbable) : `/validation` (inchangé)

## Fichiers modifiés
- `components/studio/BatchStudioForm.tsx` — deux liens mis à jour, `clientId` passé en prop à `BatchSlotCard`
