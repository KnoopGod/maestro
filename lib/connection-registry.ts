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
    id: 'public-url',
    name: 'URL publique · Stockage',
    emoji: '🌐',
    status: 'required',
    scope: 'global',
    unlocks: 'Images accessibles par Meta (Instagram refuse les URLs localhost).',
    envVars: ['MAESTRO_PUBLIC_URL'],
    guide: [
      'En local : exposer Maestro avec ngrok, Cloudflare Tunnel ou Tailscale Funnel.',
      'En prod : déployer sur Vercel, Fly.io ou Railway.',
      'Définir MAESTRO_PUBLIC_URL=https://ton-domaine.com (sans slash final).',
      'Plus tard : remplacer le stockage local par Cloudflare R2 / S3.',
    ],
    test: 'Ouvrir une image générée depuis une URL publique non-localhost dans un navigateur incognito.',
    isConfigured: () => {
      const url = process.env.MAESTRO_PUBLIC_URL || ''
      return Boolean(url) && !/localhost|127\.0\.0\.1/.test(url)
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
    name: 'Vidéo IA (image→reel)',
    emoji: '🎬',
    status: 'later',
    scope: 'global',
    unlocks: 'Reels TikTok / Instagram générés depuis les visuels validés.',
    envVars: ['LUMA_API_KEY', 'KLING_API_KEY', 'RUNWAY_API_KEY'],
    guide: [
      'Ne pas brancher avant que le tunnel texte + image + Meta soit stable.',
      'Choisir un fournisseur image-to-video (Luma, Kling, Runway).',
      'Ajouter un agent Video Director (nouveau module lib/agents/video-creator.ts).',
    ],
    test: 'Transformer une image validée en reel 5 s prêt à publier.',
    isConfigured: () => Boolean(process.env.LUMA_API_KEY || process.env.KLING_API_KEY || process.env.RUNWAY_API_KEY),
  },
]
