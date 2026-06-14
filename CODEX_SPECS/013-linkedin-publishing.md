# Spec 013 — Publication LinkedIn

## Contexte

MAESTRO publie actuellement sur Facebook et Instagram via l'API Meta Graph.
Les agents Social Expert et Image Generator génèrent déjà du contenu optimisé pour LinkedIn.
La plateforme LinkedIn est dans la liste des plateformes reconnues mais la publication n'est pas implémentée.

Fichiers clés :
- `lib/agents/meta-publisher.ts` — agent de publication Facebook + Instagram
- `lib/agents/publish-pipeline.ts` — pipeline qui appelle meta-publisher
- `lib/db/queries/social-accounts.ts` — lecture des comptes connectés par client + plateforme
- `app/clients/[id]/connections/page.tsx` — UI de connexion des réseaux
- `types/post.ts` — `PostPlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin'`

API LinkedIn utilisée :
- OAuth 2.0 : scopes `w_member_social` (post personnel) ou `w_organization_social` (page entreprise)
- Endpoint UGC Post : `POST https://api.linkedin.com/v2/ugcPosts`
- Upload image : `POST https://api.linkedin.com/v2/assets?action=registerUpload` puis PUT binary
- Token : Bearer token dans Authorization header

## Objectif

Permettre la publication de posts sur une **Page LinkedIn** depuis MAESTRO.

## Implémentation

### 1. Agent LinkedIn Publisher (lib/agents/linkedin-publisher.ts — nouveau)

```typescript
export interface LinkedInPublishInput {
  organizationId: string   // l'ID de la Page LinkedIn (ex: "123456789")
  accessToken: string      // token LinkedIn longue durée
  caption: string
  hashtags: string[]
  imageUrl?: string        // URL publique HTTPS de l'image (optionnel)
  imageBuffer?: Buffer     // si fourni, upload d'abord vers l'API Assets
}

export interface LinkedInPublishResult {
  postId: string           // URN du post : "urn:li:share:1234567890"
  url?: string             // lien direct vers le post si disponible
}

export async function publishToLinkedIn(input: LinkedInPublishInput): Promise<LinkedInPublishResult>
```

Logique :
1. Construire le texte : `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
2. Si `imageUrl` : télécharger l'image localement, puis upload via LinkedIn Assets API :
   a. `POST /v2/assets?action=registerUpload` avec `{ owner: "urn:li:organization:${organizationId}" }`
   b. Récupérer l'`uploadUrl` et l'`asset` URN
   c. `PUT uploadUrl` avec le binaire de l'image (Content-Type: image/jpeg ou image/png)
3. Construire le body UGC Post :
   - Sans image : `shareMediaCategory: "NONE"`
   - Avec image : `shareMediaCategory: "IMAGE"` + tableau `media` avec l'`asset` URN
4. `POST https://api.linkedin.com/v2/ugcPosts` avec Authorization Bearer
5. Retourner `{ postId: response.id }`
6. Gestion erreurs : throw avec message clair si 401 (token expiré) ou 422 (contenu refusé)

### 2. Intégration publish-pipeline (lib/agents/publish-pipeline.ts)

Dans la fonction de publication (après les vérifications Supervisor) :
- Pour chaque plateforme du post : si `'linkedin'` → lire le `social_accounts` du client avec `platform = 'linkedin'`
- Appeler `publishToLinkedIn({ organizationId: account.pageId, accessToken: token, caption, hashtags, imageUrl })`
- Stocker l'ID retourné dans `post.metaPostIds` (déjà un Record<string, string> — ajouter `linkedin: postId`)
- Si LinkedIn échoue : ne pas bloquer la publication sur les autres plateformes — logger l'erreur et continuer

### 3. Connexion LinkedIn (app/clients/[id]/connections/page.tsx)

Remplacer le placeholder LinkedIn existant par une UI de connexion manuelle :
- Champ "ID de la Page LinkedIn" (le numéro à 9 chiffres de la page entreprise)
- Champ "Access Token" (token Developer obtenu depuis LinkedIn Developer Portal)
- Note explicative : "Pour obtenir un token LinkedIn longue durée, voir la documentation LinkedIn OAuth 2.0"
- Bouton "Enregistrer la connexion LinkedIn"
- API : `POST /api/clients/[id]/social-accounts` (route existante) avec `platform: 'linkedin'`, `pageId`, `accessToken`

### 4. Schéma DB (lib/db/schema.ts)

Vérifier que la table `social_accounts` accepte `platform = 'linkedin'`.
Si le CHECK constraint n'inclut pas linkedin, ajouter :
```sql
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS platform_check;
-- Ou recréer avec le bon CHECK selon le driver LibSQL
```
LibSQL ne supporte pas DROP CONSTRAINT — si le CHECK bloque, supprimer et recréer la table (migration).
Vérifier dans schema.ts la valeur actuelle du CHECK sur `platform`.

### Fichiers à créer
- `lib/agents/linkedin-publisher.ts`

### Fichiers à modifier
- `lib/agents/publish-pipeline.ts` — appel linkedin-publisher si plateforme linkedin
- `app/clients/[id]/connections/page.tsx` — UI connexion LinkedIn manuelle
- `lib/db/schema.ts` — vérifier/corriger le CHECK sur platform

### Ne pas toucher
- `lib/agents/meta-publisher.ts` — publication Meta inchangée
- `lib/agents/social-expert.ts` — génération du contenu LinkedIn déjà gérée
- `types/post.ts` — PostPlatform déjà inclut 'linkedin'

### Notes importantes
- LinkedIn n'a pas de token d'échange long comme Meta — l'utilisateur doit générer son token depuis LinkedIn Developer Portal
- Les tokens LinkedIn expirent en 60 jours — afficher la date d'expiration dans l'UI connexion si possible
- `MAESTRO_ENCRYPTION_KEY` chiffre automatiquement le token LinkedIn comme pour Meta (via `saveSocialAccount`)

### Validation
```bash
npx tsc --noEmit && npm run lint && npm run build
```
