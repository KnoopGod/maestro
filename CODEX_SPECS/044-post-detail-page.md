# Spec 044 — Post Detail Page

## Objectif
Créer une page dédiée `/posts/[id]` permettant d'accéder au détail complet d'un post
par permalien — utile pour bookmarker, partager en interne, et voir toutes les métadonnées.

## Comportement

### URL
`/posts/[id]` — accessible depuis la validation et le plan

### Contenu (2 colonnes)
**Colonne gauche (contenu)** :
- Image du post (si présente)
- Caption complète (avec bouton "Copier")
- Hook + CTA si définis
- Hashtags avec chips bleutés
- Brief original
- Erreur (si status=failed)
- Retour portal client (si présent)
- Éditeur inline + swap image

**Colonne droite (sidebar)** :
- Actions rapides (PostActions)
- Supervision IA (PostSupervisor)
- Métadonnées : impact score, coût, tokens, date planification/publication, créé, modifié
- IDs Meta (si publiés)
- Liens rapides : fiche client, plan client, dupliquer dans Studio

### Breadcrumb
`Validation / {client.name} / {post.id tronqué}`

### Depuis d'autres pages
- Plan page : lien "Détail" dans chaque post row
- Validation page : bouton "Détail" dans chaque post card

## Fichiers créés / modifiés
- `app/posts/[id]/page.tsx` (créé)
- `app/plan/page.tsx` — lien "Détail" ajouté
- `app/validation/page.tsx` — bouton "Détail" ajouté
