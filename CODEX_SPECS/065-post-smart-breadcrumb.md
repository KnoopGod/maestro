# Spec 065 — Post : Breadcrumb contextuel

## Objectif
La page détail d'un post affichait toujours "← Validation" comme lien retour,
même quand on y arrivait depuis le Plan, le Calendrier ou le Dashboard.

## Comportement

### Paramètre URL
`?from=plan|calendar|dashboard|validation` — transmis en argument des liens.
Par défaut : `validation`.

### Liens retour selon contexte
| from       | Lien affiché        | href                        |
|------------|---------------------|-----------------------------|
| plan       | ← Plan              | /plan                       |
| calendar   | ← Calendrier        | /calendar                   |
| dashboard  | ← Tableau de bord   | /                           |
| validation | ← Validation (déf.) | /validation                 |

### Mise à jour des liens sources
- `app/plan/page.tsx` → `PostRow` : `/posts/${id}?from=plan`
- `app/calendar/page.tsx` → `TimelineRow` : `/posts/${id}?from=calendar`
- `components/dashboard/TodayScheduleWidget.tsx` → `/posts/${id}?from=dashboard`

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — lecture `?from` + breadcrumb dynamique
- `app/plan/page.tsx` — ajout `?from=plan` dans les liens posts
- `app/calendar/page.tsx` — ajout `?from=calendar` dans les liens posts
- `components/dashboard/TodayScheduleWidget.tsx` — ajout `?from=dashboard`
