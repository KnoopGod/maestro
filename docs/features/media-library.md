# Fonctionnalité : Médiathèque

## Rôle

La médiathèque stocke les assets visuels (photos, logos) d'un client et sert de base à la génération d'images IA. Elle alimente aussi la Direction Artistique.

## Pages

- `/clients/[id]/library` — médiathèque d'un client spécifique
- `/library` — médiathèque globale (tous clients)

## Types d'assets

```typescript
interface ClientAsset {
  id: string
  clientId: string
  fileName: string
  fileType: string   // image/jpeg, image/png, image/webp
  url: string        // URL servie statiquement ou Vercel Blob
  altText: string | null
  tags: string | null
  analysis: string | null  // résultat vision-analyzer
  createdAt: string
}
```

## Upload

`UploadZone` (Client Component) — drag & drop ou clic.

```
POST /api/clients/[id]/assets
Content-Type: multipart/form-data
Body: { file: File }
→ validation MIME côté serveur (image/*, pdf rejeté)
→ stockage local (public/uploads/) ou Vercel Blob (prod)
→ sauvegarde en DB avec URL
```

**Contrainte** : les images uploadées doivent être < 10 Mo. Les images trop lourdes ralentissent la génération IA.

## Analyse IA (`vision-analyzer`)

Après upload, l'utilisateur peut lancer une analyse IA de l'asset :

```
POST /api/clients/[id]/assets (via AnalyzeDAButton)
→ vision-analyzer (Claude Vision)
→ décrit l'image : style, couleurs, composition, ambiance
→ sauvegarde dans asset.analysis
```

## Direction Artistique

`AnalyzeDAButton` déclenche :
```
POST /api/clients/[id]/analyze-da
→ visual-identity agent
→ synthèse DA à partir des assets du client
→ sauvegarde dans client_visual_identity
```

## Suppression

```
DELETE /api/clients/[id]/assets/[assetId]
→ supprime fichier du disque/Blob
→ supprime l'entrée DB
```

## Stockage

| Environnement | Stockage | URL pattern |
|---------------|----------|-------------|
| Dev | `public/uploads/clients/[id]/` | `/uploads/clients/[id]/fichier.jpg` |
| Prod | Vercel Blob | `https://*.public.blob.vercel-storage.com/...` |

`lib/storage/local.ts` abstrait les deux modes.

## Contrainte Meta

Meta doit pouvoir accéder aux images pour les publier. En dev, l'URL `/uploads/...` n'est pas accessible depuis l'extérieur.
Solution : `CODEXRS_PUBLIC_URL=https://mon-tunnel.ngrok.io` pour que les URLs deviennent accessibles.

## Composants

| Composant | Rôle |
|-----------|------|
| `UploadZone` | Interface d'upload avec drag & drop |
| `AssetCard` | Affichage d'un asset avec actions |
| `AnalyzeDAButton` | Déclenche l'analyse DA |
