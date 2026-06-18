# Spec 104 — Agents : conserver le filtre client dans le lien retour du détail job

## Objectif
Quand l'utilisateur consulte un job depuis la page Agents filtrée par client, le lien retour du détail de job renvoie vers `/agents?client=X` plutôt que `/agents`.

## Comportement

### Avant
- Cliquer sur un job depuis `/agents?client=abc` ouvrait `/agents/jobs/123`
- Le lien retour "Activité agents" renvoyait vers `/agents` (filtre perdu)

### Après
- Cliquer sur un job depuis `/agents?client=abc` ouvre `/agents/jobs/123?client=abc`
- Le lien retour "Activité agents" renvoie vers `/agents?client=abc`
- Sans filtre actif, le comportement reste inchangé

## Fichiers modifiés
- `app/agents/page.tsx` — `JobCard` reçoit `clientFilter` et l'inclut dans le lien job
- `app/agents/jobs/[id]/page.tsx` — lit le param `client` via `useSearchParams`, reconstruit le lien retour
