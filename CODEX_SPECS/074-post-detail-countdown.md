# Spec 074 — Post detail : Compte à rebours de publication

## Objectif
Pour les posts au statut `scheduled`, afficher dans la sidebar (section Actions)
le délai restant avant publication : "Dans 2h30", "Dans 14 jours", ou "En retard de 3h".

## Comportement

### Affichage
Affiché dans la zone Actions, en dessous du bouton Planifier.
- Si `scheduledAt > now` : "📅 Dans {X}h" ou "📅 Dans {X}j {Yh}" (bleu)
- Si `scheduledAt <= now` : "⏰ En retard de {X}h" (rouge)
- Masqué si `status !== 'scheduled'`

### Calcul
Durée calculée côté serveur (Server Component) — pas de JS côté client.
Valeur formatée comme chaîne de texte, passée au composant `PostActions`.

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — calcul du délai + prop `timeUntilLabel`
- `components/posts/PostActions.tsx` — affichage conditionnel du délai
