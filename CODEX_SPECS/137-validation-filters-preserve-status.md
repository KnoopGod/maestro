# Spec 137 — Validation : filtres client et tri préservent le filtre de statut actif

## Objectif
Dans la page Validation, les chips de filtre client et les chips de tri utilisaient des hrefs sans le paramètre `status`, perdant le filtre de statut actif (Brouillons, Prêts, Échecs) quand on changeait de client ou de tri.

## Comportement

### Avant
- Statut "Brouillons" actif + clic client "Bistro" → `/validation?client=xxx` (filtre statut perdu)
- Statut "Prêts" actif + clic "Impact" → `/validation?sort=impact` (filtre statut perdu)
- Bouton X pour effacer le client → `/validation?sort=oldest` (filtre statut perdu)

### Après
- Statut "Brouillons" actif + clic client "Bistro" → `/validation?client=xxx&status=draft`
- Statut "Prêts" actif + clic "Impact" → `/validation?sort=impact&status=ready`
- Bouton X pour effacer le client → préserve `status=draft` si actif

## Fichiers modifiés
- `app/validation/page.tsx` — quatre `buildUrl()` calls mis à jour avec `status: statusFilter`
