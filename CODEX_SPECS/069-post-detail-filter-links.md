# Spec 069 — Post detail : Chips cliquables (pilier, client, plateforme)

## Objectif
Dans la page détail d'un post, les chips "pilier", "client" et "plateforme"
sont actuellement statiques. Les rendre cliquables pour accéder au Plan filtré.

## Comportement

| Chip       | Lien                             |
|------------|----------------------------------|
| Pilier     | `/plan?pillar={pillar}`          |
| Plateforme | `/plan?platform={platform}`      |

Note : le client est déjà un lien vers `/clients/{id}`.

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — pillar et plateformes en `<Link>`
