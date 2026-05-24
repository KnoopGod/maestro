/**
 * Global connection registry — describes every external service Maestro
 * can plug into, in the recommended onboarding order.
 *
 * Used by /connections to render the guided setup.
 */
export type ConnectionStatus = 'required' | 'recommended' | 'later'
export type ConnectionScope = 'global' | 'per-client'

export interface ConnectionStep {
  id: string
  name: string
  emoji: string
  status: ConnectionStatus
  scope: ConnectionScope
  unlocks: string
  envVars: string[]
  guide: string[]
  test: string
  /** Function called at render time to check if env vars are present (server-side). */
  isConfigured?: () => boolean
}

export const CONNECTIONS: ConnectionStep[] = [
  {
    id: 'anthropic',
    name: 'Anthropic · Claude',
    emoji: '🧠',
    status: 'required',
    scope: 'global',
    unlocks: 'Stratégie, captions, idées de posts, supervision qualité, analyse DA.',
    envVars: ['ANTHROPIC_API_KEY'],
    guide: [
      'Créer une clé sur console.anthropic.com → API Keys.',
      'Ajouter ANTHROPIC_API_KEY=sk-ant-... dans .env.local.',
      'Modèle par défaut : claude-opus-4-7 (adaptive thinking activé).',
    ],
    test: 'Générer un post dans Studio. Sans clé, Maestro bascule sur un fallback déterministe.',
    isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),
  },
  {
    id: 'openai',
    name: 'OpenAI · Images',
    emoji: '🎨',
    status: 'required',
    scope: 'global',
    unlocks: 'Génération des visuels carrés Facebook et Instagram (gpt-image-1).',
    envVars: ['OPENAI_API_KEY'],
    guide: [
      'Créer une clé sur platform.openai.com → API Keys.',
      'Ajouter OPENAI_API_KEY=sk-... dans .env.local.',
      'Crédit minimum recommandé : 5 $ (≈ 60 images).',
    ],
    test: 'Générer un post complet dans Studio — une image doit remplacer le placeholder.',
    isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  },
  {
    id: 'meta',
    name: 'Meta · Graph API',
    emoji: '👍',
    status: 'required',
    scope: 'per-client',
    unlocks: 'Publication réelle sur Facebook + Instagram depuis Maestro.',
    envVars: ['META_APP_ID', 'META_APP_SECRET'],
    guide: [
      'Créer une app Business sur developers.facebook.com.',
      'Activer le use case « Tout gérer sur votre Page » + permission pages_manage_posts.',
      'Lier le compte Instagram Business à la page Facebook du client.',
      'Pour chaque client : aller dans /clients/[id]/connections, coller un Page Access Token.',
      'Vérifier le token avec « 🩺 Diagnostiquer » (scopes pages_manage_posts + pages_read_engagement + instagram_basic + instagram_content_publish).',
    ],
    test: 'Publier un post validé sur Facebook + Instagram avec une image accessible publiquement.',
    isConfigured: () => Boolean(process.env.META_APP_ID),
  },
  {
    id: 'storage',
    name: 'Stockage · Vercel Blob',
    emoji: '🗄️',
    status: 'required',
    scope: 'global',
    unlocks: 'Images générées accessibles publiquement par Meta. Sans Blob, la génération d\'images crashe sur Vercel (filesystem read-only).',
    envVars: ['BLOB_READ_WRITE_TOKEN'],
    guide: [
      'Dans le dashboard Vercel → Storage → Blob → Create Store → Connect to Project.',
      'Vercel copie automatiquement BLOB_READ_WRITE_TOKEN dans les variables d\'environnement du projet.',
      'En local : sans BLOB_READ_WRITE_TOKEN, les fichiers sont stockés dans public/uploads/ (normal).',
      'Les URLs Blob sont publiques HTTPS — Meta peut les fetcher sans MAESTRO_PUBLIC_URL.',
    ],
    test: 'Générer un post dans Studio, vérifier que l\'URL de l\'image commence par https://...blob.vercel-storage.com',
    isConfigured: () => Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  },
  {
    id: 'turso',
    name: 'Base de données · Turso',
    emoji: '🗃️',
    status: 'required',
    scope: 'global',
    unlocks: 'Persistance des données entre les déploiements Vercel. Sans Turso, la DB SQLite locale est réinitialisée à chaque redéploiement.',
    envVars: ['DATABASE_URL', 'DATABASE_AUTH_TOKEN'],
    guide: [
      'Créer un compte sur turso.tech et installer la CLI : brew install tursodatabase/tap/turso',
      'Créer une DB : turso db create maestro',
      'Récupérer l\'URL : turso db show maestro --url → libsql://maestro-xxx.turso.io',
      'Créer un token : turso db tokens create maestro',
      'Dans Vercel : Settings → Environment Variables → ajouter DATABASE_URL et DATABASE_AUTH_TOKEN.',
      'La DB Turso est compatible LibSQL — aucun changement de code requis.',
    ],
    test: 'Redéployer sur Vercel, créer un client, redéployer à nouveau : le client doit toujours être là.',
    isConfigured: () => {
      const url = process.env.DATABASE_URL || ''
      return Boolean(url) && !url.startsWith('file:')
    },
  },
  {
    id: 'cron',
    name: 'Cron · Publication planifiée',
    emoji: '⏰',
    status: 'recommended',
    scope: 'global',
    unlocks: 'Publication automatique des posts planifiés à l\'heure dite.',
    envVars: ['CRON_SECRET'],
    guide: [
      'Définir CRON_SECRET=un-mot-de-passe-aleatoire dans .env.local.',
      'En prod : ajouter un cron Vercel (vercel.json) qui POST /api/cron/publish-due toutes les 5 min.',
      'Header requis : Authorization: Bearer $CRON_SECRET.',
      'Alternative locale : déclencher manuellement depuis /calendar (« Publier les posts dus »).',
    ],
    test: 'Planifier un post à +2 min, attendre, vérifier la publication automatique.',
    isConfigured: () => Boolean(process.env.CRON_SECRET),
  },
  {
    id: 'video',
    name: 'Vidéo IA · Luma Dream Machine',
    emoji: '🎬',
    status: 'recommended',
    scope: 'global',
    unlocks: 'Reels 9:16 générés depuis les visuels validés — bouton « Animer en Reel » dans la bibliothèque.',
    envVars: ['LUMA_API_KEY'],
    guide: [
      'L\'agent Video Creator est implémenté (lib/agents/video-creator.ts).',
      'Créer un compte sur lumalabs.ai → API Keys.',
      'Ajouter LUMA_API_KEY=luma-... dans .env.local et les variables Vercel.',
      'L\'image source doit être sur une URL publique HTTPS (Vercel Blob requis).',
      'Le reel généré est automatiquement ajouté à la bibliothèque du client.',
    ],
    test: 'Dans la bibliothèque d\'un client, cliquer « Animer en Reel » sur une image — le reel doit apparaître dans les 2 min.',
    isConfigured: () => Boolean(process.env.LUMA_API_KEY),
  },
]
