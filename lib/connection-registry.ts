/**
 * Global connection registry — describes every external service CODEXRS
 * can plug into, in the recommended onboarding order.
 *
 * Used by /connections to render the guided setup.
 */
export type ConnectionStatus = 'required' | 'recommended' | 'later'
export type ConnectionScope = 'global' | 'per-client'
export type ConnectionCategory = 'ai' | 'social' | 'infra' | 'automation'

export interface ConnectionStep {
  id: string
  name: string
  emoji: string
  category: ConnectionCategory
  status: ConnectionStatus
  scope: ConnectionScope
  unlocks: string
  purpose: string
  specialty: string
  usedBy: string[]
  credits: string
  providerUrl?: string
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
    category: 'ai',
    status: 'required',
    scope: 'global',
    unlocks: 'Stratégie, captions, idées de posts, supervision qualité, analyse DA.',
    purpose: 'Donner à CODEXRS son niveau agence : stratégie, raisonnement, critique qualité et analyse de marque.',
    specialty: 'Raisonnement long, stratégie marketing, supervision éditoriale, analyse de documents et vision.',
    usedBy: ['Strategy Director', 'Social Expert', 'Claude Supervisor', 'DA Curator', 'Vision Analyzer'],
    credits: 'API payante. Prévoir un petit budget mensuel selon volume ; commencer avec un plafond bas côté console Anthropic.',
    providerUrl: 'https://console.anthropic.com/settings/keys',
    envVars: ['ANTHROPIC_API_KEY'],
    guide: [
      'Créer une clé sur console.anthropic.com → API Keys.',
      'Ajouter ANTHROPIC_API_KEY=sk-ant-... dans .env.local.',
      'Modèle par défaut : claude-opus-4-7 (adaptive thinking activé).',
    ],
    test: 'Générer un post dans Studio. Sans clé, CODEXRS bascule sur un fallback déterministe.',
    isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),
  },
  {
    id: 'openai',
    name: 'OpenAI · Images',
    emoji: '🎨',
    category: 'ai',
    status: 'required',
    scope: 'global',
    unlocks: 'Génération des visuels carrés Facebook et Instagram (gpt-image-1).',
    purpose: 'Créer les images IA des posts quand il manque une photo réelle adaptée.',
    specialty: 'Génération d’images, variantes visuelles, assets carrés prêts pour Facebook/Instagram.',
    usedBy: ['Visual Director', 'Image Generator'],
    credits: 'API payante à l’image. Recommandé : crédit initial 5 à 20 $ pour valider le MVP.',
    providerUrl: 'https://platform.openai.com/api-keys',
    envVars: ['OPENAI_API_KEY', 'OPENAI_IMAGE_MODEL'],
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
    category: 'social',
    status: 'required',
    scope: 'per-client',
    unlocks: 'Publication réelle sur Facebook + Instagram depuis CODEXRS.',
    purpose: 'Publier automatiquement les posts validés sur les pages Facebook et comptes Instagram Business des clients.',
    specialty: 'Connexion page Facebook, Instagram Business, test de token, publication photo/text.',
    usedBy: ['Publisher · Meta'],
    credits: 'Gratuit côté API, mais demande une app Meta, des permissions et parfois une validation Meta.',
    providerUrl: 'https://developers.facebook.com/apps',
    envVars: ['META_APP_ID', 'META_APP_SECRET'],
    guide: [
      'Créer une app Business sur developers.facebook.com et configurer META_APP_ID + META_APP_SECRET une fois.',
      'Activer les scopes Pages/Instagram : pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish.',
      'Pour chaque client : lier son Instagram professionnel à sa Page Facebook.',
      'Dans /clients/[id]/connections : coller un User Access Token pour découvrir les Pages, puis sélectionner la Page du client.',
      'CODEXRS stocke le Page Access Token retourné par Meta, puis le diagnostic vérifie les scopes avant test.',
    ],
    test: 'Publier un post validé sur Facebook + Instagram avec une image accessible publiquement.',
    isConfigured: () => Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
  },
  {
    id: 'storage',
    name: 'Stockage · Vercel Blob',
    emoji: '🗄️',
    category: 'infra',
    status: 'required',
    scope: 'global',
    unlocks: 'Images générées accessibles publiquement par Meta. Sans Blob, la génération d\'images crashe sur Vercel (filesystem read-only).',
    purpose: 'Héberger les images générées ou uploadées sur des URLs publiques que Meta peut lire.',
    specialty: 'Stockage médias public, URLs HTTPS, compatibilité Vercel production.',
    usedBy: ['Image Generator', 'Video Creator', 'Publisher · Meta', 'Library'],
    credits: 'Souvent inclus/faible coût au début. Surveiller le stockage et la bande passante si beaucoup de médias.',
    providerUrl: 'https://vercel.com/storage/blob',
    envVars: ['BLOB_READ_WRITE_TOKEN'],
    guide: [
      'Dans le dashboard Vercel → Storage → Blob → Create Store → Connect to Project.',
      'Vercel copie automatiquement BLOB_READ_WRITE_TOKEN dans les variables d\'environnement du projet.',
      'En local : sans BLOB_READ_WRITE_TOKEN, les fichiers sont stockés dans public/uploads/ (normal).',
      'Les URLs Blob sont publiques HTTPS — Meta peut les fetcher sans CODEXRS_PUBLIC_URL.',
    ],
    test: 'Générer un post dans Studio, vérifier que l\'URL de l\'image commence par https://...blob.vercel-storage.com',
    isConfigured: () => Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  },
  {
    id: 'turso',
    name: 'Base de données · Turso',
    emoji: '🗃️',
    category: 'infra',
    status: 'required',
    scope: 'global',
    unlocks: 'Persistance des données entre les déploiements Vercel. Sans Turso, la DB SQLite locale est réinitialisée à chaque redéploiement.',
    purpose: 'Sauvegarder durablement clients, posts, connexions, assets, stratégies, coûts et historiques.',
    specialty: 'Base LibSQL distante compatible SQLite, simple à brancher sur Vercel.',
    usedBy: ['Toute l’application', 'Agents runtime', 'Analytics', 'Calendar'],
    credits: 'Plan gratuit suffisant au début ; prévoir upgrade quand clients, assets et historique augmentent.',
    providerUrl: 'https://turso.tech',
    envVars: ['DATABASE_URL', 'DATABASE_AUTH_TOKEN'],
    guide: [
      'Créer un compte sur turso.tech et installer la CLI : brew install tursodatabase/tap/turso',
      'Créer une DB : turso db create codexrs',
      'Récupérer l\'URL : turso db show codexrs --url → libsql://codexrs-xxx.turso.io',
      'Créer un token : turso db tokens create codexrs',
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
    category: 'automation',
    status: 'recommended',
    scope: 'global',
    unlocks: 'Publication automatique des posts planifiés à l\'heure dite.',
    purpose: 'Déclencher la publication des posts planifiés sans action manuelle.',
    specialty: 'Appel sécurisé de /api/cron/publish-due, publication différée, contrôle des posts dus.',
    usedBy: ['Publisher · Meta', 'Calendar'],
    credits: 'Gratuit ou inclus selon Vercel/GitHub Actions. Besoin surtout d’un CRON_SECRET.',
    providerUrl: 'https://vercel.com/docs/cron-jobs',
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
    category: 'ai',
    status: 'recommended',
    scope: 'global',
    unlocks: 'Reels 9:16 générés depuis les visuels validés — bouton « Animer en Reel » dans la bibliothèque.',
    purpose: 'Transformer les images validées en vidéos courtes pour Reels, Stories et TikTok.',
    specialty: 'Image-to-video, mouvements courts, reels 9:16, déclinaisons animées.',
    usedBy: ['Video Creator'],
    credits: 'API payante/crédits vidéo. À brancher après stabilisation texte + image + Meta.',
    providerUrl: 'https://lumalabs.ai',
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
