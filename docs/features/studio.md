# Fonctionnalité : Studio — Génération de posts

## Rôle

Le Studio est le point d'entrée de la création de contenu. L'utilisateur y sélectionne un client, saisit un brief, et déclenche le pipeline de génération IA.

## Page

`app/studio/page.tsx` → charge `StudioForm` (Client Component, 1335+ lignes).

## Composants

| Composant | Type | Rôle |
|-----------|------|------|
| `StudioForm` | Client | Formulaire principal + orchestration |
| `PostIdeasPanel` | Client | Suggestions de briefs IA |

> ⚠️ **Problème connu (I1)** : `StudioForm.tsx` dépasse 1335 lignes. À découper en Phase 2.

## Flux utilisateur

```
1. Sélectionner un client (dropdown)
2. Saisir un brief (texte libre)
3. Sélectionner les plateformes cibles (Facebook / Instagram)
4. Cliquer "Générer"
5. Attendre 30-90 secondes (⚠️ bloquant)
6. Voir le résultat : texte + image générée
7. Approuver, modifier, ou rejeter
```

## API appelée

`POST /api/studio/generate-post`

```typescript
Body: {
  clientId: string
  brief: string
  platforms: string[]
  imageStyle?: string
  tone?: string
}

Response: {
  postId: string
  caption: string
  hashtags: string[]
  imageUrl: string
  supervisorVerdict: 'ready' | 'revise' | 'blocked'
  cost: number
}
```

## Pipeline de génération

```
generate-post route
    → Account Director (analyse brief)
    → Social Expert (caption + hashtags)
    → Image Generator (gpt-image-1)
    → Supervisor (contrôle qualité)
    → sauvegarde post en DB avec statut 'draft' ou 'needs_revision'
```

Voir `docs/architecture/agents.md` pour les détails du pipeline.

## Suggestions de brief (`PostIdeasPanel`)

`POST /api/studio/suggest-brief` — appelle Claude pour suggérer 3-5 briefs adaptés au client.
L'utilisateur peut cliquer sur une suggestion pour pré-remplir le formulaire.

## Régénération de caption

`POST /api/posts/[id]/regenerate-caption` — régénère uniquement le texte sans toucher à l'image.
Disponible depuis la page de détail d'un post (`/validation`).

## Risque critique

**C1** : Le pipeline est synchrone et bloquant. Sur Vercel, le timeout est 60 secondes.
Un pipeline lent (image haute résolution + réseau Meta lent) peut échouer silencieusement.
**Solution planifiée** : Phase 4 — pipeline asynchrone avec polling ou Server-Sent Events.
