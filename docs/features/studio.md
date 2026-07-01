# Fonctionnalité : Studio — Génération de posts

## Rôle

Le Studio est le point d'entrée de la création de contenu. L'utilisateur y sélectionne un client, saisit un brief, et déclenche le pipeline de génération IA.

## Page

`app/studio/page.tsx` charge `StudioForm` et ses sous-composants client.

## Composants

| Composant | Type | Rôle |
|-----------|------|------|
| `StudioForm` | Client | Formulaire principal + orchestration |
| `PostIdeasPanel` | Client | Suggestions de briefs IA |

## Flux utilisateur

```
1. Sélectionner un client (dropdown)
2. Saisir un brief (texte libre)
3. Sélectionner les plateformes cibles (Facebook / Instagram)
4. Cliquer "Générer"
5. Suivre le travail des agents par polling
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

Response HTTP 202: {
  jobId: string
}
```

## Pipeline de génération

```
generate-post route
    → crée un job
    → retourne HTTP 202 + jobId
    → lance le pipeline via after()
        → Account Director (analyse brief)
        → Social Expert (caption + hashtags)
        → Image Generator (gpt-image-1)
        → Supervisor (contrôle qualité)
        → sauvegarde le post et termine le job

Le frontend interroge `/api/agents/jobs/[jobId]` jusqu'à la fin du traitement.
```

Voir `docs/architecture/agents.md` pour les détails du pipeline.

## Suggestions de brief (`PostIdeasPanel`)

`POST /api/studio/suggest-brief` — appelle Claude pour suggérer 3-5 briefs adaptés au client.
L'utilisateur peut cliquer sur une suggestion pour pré-remplir le formulaire.

## Régénération de caption

`POST /api/posts/[id]/regenerate-caption` — régénère uniquement le texte sans toucher à l'image.
Disponible depuis la page de détail d'un post (`/validation`).

## Limite connue

Le pipeline est asynchrone pour la requête utilisateur, mais `after()` n'est pas
une file de tâches durable. Le cron `cleanup-jobs` détecte les jobs bloqués sans
les relancer. Une vraie queue sera nécessaire avant une montée en charge.
