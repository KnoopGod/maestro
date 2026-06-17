# Spec 043 — Client Stats Bar

## Objectif
Afficher un résumé chiffré immédiat en haut de la fiche client (entre le header et les
quick actions), pour évaluer l'état du client d'un coup d'œil sans scroller.

## Comportement

### Composant `ClientStat`
Grille de 4 KPIs :
- **Posts ce mois** — posts créés depuis le 1er du mois (tous statuts)
- **Posts publiés** — total cumulé
- **Impact moyen** — moyenne des `impactScore` des posts publiés (affiche `—` si aucun)
- **En validation** — posts en statut `draft` ou `ready` ; amber si > 0, gris si 0 ; cliquable → `/validation?client=[id]`

### Données
Toutes dérivées de `clientPosts` déjà chargé en page — aucune requête supplémentaire.

### Design
- Grille `2×2` mobile, `4×1` desktop
- Chiffre en gras, coloré par domaine (purple, emerald, blue, amber)
- Label en majuscules 10px
- Sous-label gris discret

## Fichiers modifiés
- `app/clients/[id]/page.tsx` — stats dérivées + composant `ClientStat` + insertion dans JSX
