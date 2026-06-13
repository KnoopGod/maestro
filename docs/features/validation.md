# Fonctionnalité : Validation des posts

## Rôle

La Validation est la file d'approbation des posts générés par le Studio. L'utilisateur y examine, modifie, approuve ou rejette chaque post avant publication.

## Page

`app/validation/page.tsx` — liste les posts en attente d'approbation, regroupés par client.

## Statuts des posts

| Statut | Description | Action disponible |
|--------|-------------|-------------------|
| `draft` | Généré, supervisor OK | Approuver / Modifier / Rejeter |
| `needs_revision` | Supervisor demande révision | Modifier caption / Régénérer |
| `approved` | Validé pour publication | Planifier / Publier maintenant |
| `scheduled` | Planifié | Voir date / Annuler |
| `published` | Publié sur Meta | Voir insights |
| `failed` | Erreur de publication | Réessayer |
| `archived` | Archivé | — |

Définis dans `types/post.ts`.

## Actions disponibles

### Approbation

```
Clic "Approuver" → statut devient 'approved'
```

### Planification

```
POST /api/posts/[id]/schedule
Body: { scheduledAt: ISO string, platforms: string[] }
→ statut becomes 'scheduled'
```

### Publication immédiate

```
POST /api/studio/publish-post
Body: { postId: string }
→ publish-pipeline → meta-publisher
→ statut becomes 'published' ou 'failed'
```

### Rejection

```
PATCH /api/posts/[id]
Body: { status: 'archived' }
```

### Re-supervision

```
POST /api/posts/[id]/supervise
→ supervisor agent re-évalue le post
→ met à jour le verdict et les suggestions
```

### Régénération caption

```
POST /api/posts/[id]/regenerate-caption
Body: { instructions?: string }
→ social-expert re-génère le texte avec instructions optionnelles
```

## Composants

| Composant | Type | Rôle |
|-----------|------|------|
| `PostActions` | Client | Boutons d'action sur un post |
| `PublishErrorHint` | Client | Message d'aide sur erreur Meta |

## Erreurs de publication Meta

`lib/meta-error-actions.ts` — mappe les codes d'erreur Meta vers des messages compréhensibles.
`components/posts/PublishErrorHint.tsx` — affiche le message avec une action corrective.

Erreurs courantes :
- Token expiré → reconnecter le compte
- Page non accessible → vérifier les permissions Meta
- Image non accessible → vérifier `CODEXRS_PUBLIC_URL`
