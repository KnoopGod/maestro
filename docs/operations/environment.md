# Environnement — Variables et configuration

## Variables d'environnement

### Requises en développement

```env
ANTHROPIC_API_KEY=sk-ant-...          # Claude Sonnet 4.6 + Vision
OPENAI_API_KEY=sk-...                  # Génération images gpt-image-1
CODEXRS_PASSWORD=mot_de_passe_admin    # Auth (désactivée si absent)
```

### Requises en production

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
CODEXRS_PASSWORD=...
CODEXRS_PUBLIC_URL=https://maestro.votredomaine.com   # URL HTTPS publique pour Meta
DATABASE_URL=libsql://...turso.io                      # Turso
DATABASE_AUTH_TOKEN=...                                # Turso
CRON_SECRET=...                                        # Vercel Cron
BLOB_READ_WRITE_TOKEN=...                              # Vercel Blob
```

### Optionnelles

```env
OPENAI_IMAGE_MODEL=gpt-image-1         # Modèle image (défaut: gpt-image-1)
META_APP_ID=...                         # Active l'échange token long-durée Meta
META_APP_SECRET=...                     # Secret app Meta
LUMA_API_KEY=...                        # Génération vidéo (future)
CODEXRS_AUTO_INIT_SCHEMA=false          # Désactive l'init auto schema en prod
OLLAMA_HOST=http://localhost:11434      # Ollama local (feature expérimentale)
```

### Variables Legacy (compatibilité)

```env
MAESTRO_PASSWORD=...    # Alias de CODEXRS_PASSWORD (backward compat)
```

## Configuration locale

Copier `.env.example` en `.env.local` :
```bash
cp .env.example .env.local
```

`.env.local` est ignoré par Git. **Ne jamais committer de secrets.**

## Vercel

Les variables d'environnement de production sont configurées dans le Vercel Dashboard.  
Ne pas committer `.env.vercel.local` ni `.env.vercel.production.local`.

Variables à configurer sur Vercel :
- Toutes les variables "requises en production" ci-dessus
- `NEXT_PUBLIC_APP_URL` = URL de déploiement (pour les liens absolus)

## Turso (base de données production)

1. Créer une base sur [turso.tech](https://turso.tech)
2. Récupérer `DATABASE_URL` (format : `libsql://dbname-org.turso.io`)
3. Créer un token d'authentification → `DATABASE_AUTH_TOKEN`
4. Configurer dans Vercel Environment Variables

**Le schéma se crée automatiquement au premier démarrage** (sauf si `CODEXRS_AUTO_INIT_SCHEMA=false`).
