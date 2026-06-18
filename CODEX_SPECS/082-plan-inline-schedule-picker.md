# Spec 082 — Plan : Planificateur inline dans la ligne de post

## Objectif
Permettre de planifier ou modifier la date d'un post directement depuis la ligne du plan, sans naviguer vers la page de détail.

## Comportement

### Composant InlineSchedulePicker
- Affiché dans le footer de PostRow à la place de la date de création / date planifiée
- Pour un post non-planifié : bouton "📅 Planifier" qui ouvre un mini-form inline
- Pour un post planifié : affiche la date actuelle, clic → ouvre le mini-form pour modifier
- Mini-form : input datetime-local + bouton "OK" + bouton "✕" pour annuler
- En brouillon ou prêt : affiche le bouton "Planifier"
- Publié : masqué (pas de replanification)
- Appelle `/api/posts/{id}/schedule` (POST avec `scheduledAt`)
- Après succès : `router.refresh()` + ferme le form

## Fichiers créés/modifiés
- `components/plan/InlineSchedulePicker.tsx` — nouveau composant client
- `app/plan/page.tsx` — remplace le span date par `<InlineSchedulePicker>`
