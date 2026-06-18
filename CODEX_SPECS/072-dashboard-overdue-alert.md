# Spec 072 — Dashboard : Alerte posts en retard

## Objectif
Alerter quand des posts sont planifiés mais leur date de publication est dépassée
(statut `scheduled` + `scheduledAt` < maintenant), ce qui signale que le cron
n'a pas tourné ou a échoué.

## Comportement

### Alerte
Bandeau orange visible sur le dashboard si ≥ 1 post en retard.
Affiche : nombre de posts + lien vers le calendrier.
Message : "N post(s) en retard · Cron peut-être inactif. Publier manuellement ?"

### Requête
`listOverduePosts()` : posts où `status = 'scheduled' AND scheduled_at <= now`.

## Fichiers modifiés
- `lib/db/queries/posts.ts` — `listOverduePosts()`
- `components/dashboard/OverduePostsAlert.tsx` — nouveau composant
- `app/page.tsx` — intégration dans la page d'accueil
