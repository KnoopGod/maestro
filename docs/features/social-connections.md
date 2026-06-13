# Fonctionnalité : Connexions sociales

## Rôle

Permet de connecter les comptes Facebook et Instagram d'un client via l'API Meta OAuth, pour pouvoir publier des posts directement depuis MAESTRO.

## Pages

- `/clients/[id]/connections` — connexions d'un client
- `/connections` — vue globale de toutes les connexions
- `/social/settings/connections` — paramètres globaux

## Flux de connexion Meta

```
1. Clic "Connecter Meta" dans MetaConnectionWizard
2. Redirect vers Facebook Login (OAuth)
3. Callback → POST /api/meta/connect (échange code → token)
4. POST /api/meta/discover (liste pages FB + comptes IG)
5. Sélection de la page Facebook et du compte Instagram
6. Sauvegarde dans client_social_accounts
```

## Données stockées

```typescript
interface SocialAccount {
  id: string
  clientId: string
  platform: 'facebook' | 'instagram'
  accountId: string      // ID Meta de la page/compte
  accountName: string
  accessToken: string    // chiffré en DB si MAESTRO_ENCRYPTION_KEY est configuré
  tokenExpiresAt: string | null
  pageId: string | null  // ID de la Page Facebook
  instagramAccountId: string | null
  createdAt: string
  updatedAt: string
}
```

## Sécurité des tokens

Les tokens Meta sont chiffrés dans `client_social_accounts.access_token` avec AES-256-GCM si `MAESTRO_ENCRYPTION_KEY` est configuré.
Les anciens tokens en clair doivent être reconnectés ou migrés après activation de la clé.

## Vérification de token

```
POST /api/meta/debug-token
→ appelle l'API Meta pour vérifier la validité du token
→ retourne { valid: boolean, expiresAt: string, scopes: string[] }
```

## Test de publication

```
POST /api/meta/test-post
Body: { clientId: string, message: string }
→ publie un post de test sur la page connectée
→ retourne { success: boolean, postId: string }
```

## Composants

| Composant | Rôle |
|-----------|------|
| `MetaConnectionWizard` | Wizard multi-étapes de connexion |
| `MetaPreflightChecklist` | Vérifie les pré-requis avant de lancer OAuth |

## Pré-requis Meta

Avant de connecter un compte, `MetaPreflightChecklist` vérifie :
- `CODEXRS_PUBLIC_URL` est défini (pour les images)
- L'app Meta est configurée avec les bonnes permissions
- Le domaine est autorisé dans le tableau de bord Meta Developers

## Permissions Meta requises

- `pages_manage_posts` — publier sur une Page Facebook
- `pages_read_engagement` — lire les insights
- `instagram_basic` — accès de base Instagram
- `instagram_content_publish` — publier sur Instagram

## Erreurs courantes

| Code Meta | Cause | Solution |
|-----------|-------|----------|
| 190 | Token expiré | Reconnecter le compte |
| 200 | Permission manquante | Vérifier les scopes dans Meta Developers |
| 368 | Compte temporairement bloqué | Attendre 24h |
| 100 | Page ID invalide | Redécouvrir les pages |
