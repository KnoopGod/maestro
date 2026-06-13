# Architecture — Base de données

## Technologie

LibSQL (compatible SQLite + Turso cloud).
- Dev : `file:./maestro.db`
- Production : Turso via `DATABASE_URL` + `DATABASE_AUTH_TOKEN`

## Schéma

### `clients`
Profil complet de chaque client HORECA.

| Colonne | Type | Description |
|---|---|---|
| id | TEXT PK | nanoid |
| name | TEXT | Nom du client |
| type | TEXT | `restaurant\|hotel\|bar\|bnb\|restaurant_hotel` |
| city | TEXT | Ville |
| status | TEXT | `active\|paused\|archived` |
| emoji | TEXT | Emoji identifiant (UI) |
| color | TEXT | Classes Tailwind du gradient |
| description | TEXT | Description du client |
| brand_voice_tone | TEXT | Ton de la marque |
| brand_voice_keywords | TEXT | Mots-clés de marque |
| brand_voice_avoid | TEXT | Mots à éviter |
| languages | TEXT | JSON array, ex: `["fr"]` |
| strategy | TEXT | JSON — stratégie générée par IA |
| website_url | TEXT | URL du site web |

### `client_social_accounts`
Connexions Meta par client.

| Colonne | Type | Description |
|---|---|---|
| platform | TEXT | `instagram\|facebook\|tiktok\|linkedin\|google_business` |
| account_id | TEXT | ID Meta de la page |
| access_token | TEXT | ⚠️ En clair — à chiffrer (Phase 3) |
| refresh_token | TEXT | ⚠️ En clair — à chiffrer (Phase 3) |
| expires_at | INTEGER | Timestamp expiration token |

### `client_assets`
Images et vidéos uploadées pour chaque client.

| Colonne | Type | Description |
|---|---|---|
| type | TEXT | `image\|video\|logo\|document\|brand_guide` |
| url | TEXT | URL publique |
| ai_description | TEXT | Description IA de l'asset |
| ai_tags | TEXT | JSON array de tags |
| dominant_colors | TEXT | JSON array couleurs dominantes |
| starred | INTEGER | 0/1 — asset mis en avant |
| used_count | INTEGER | Nombre d'utilisations |

### `client_visual_identity`
Synthèse Direction Artistique (DA) par client.
Générée par `visual-identity.ts` à partir des assets.

| Colonne | Type | Description |
|---|---|---|
| palette | TEXT | JSON — couleurs |
| lighting_style | TEXT | Style d'éclairage préféré |
| overall_mood | TEXT | Ambiance générale |
| style_prompt | TEXT | Prompt visuel injecté dans image-generator |
| assets_count | INTEGER | Nombre d'assets analysés |

### `posts`
Posts générés (brouillons, publiés, en échec).

| Colonne | Type | Description |
|---|---|---|
| status | TEXT | `draft\|ready\|scheduled\|published\|failed` |
| platforms | TEXT | JSON array ex: `["facebook","instagram"]` |
| content_type | TEXT | `photo\|reel\|story` |
| brief | TEXT | Brief utilisateur |
| caption | TEXT | Texte généré |
| hashtags | TEXT | JSON array |
| hook | TEXT | Accroche (première phrase) |
| cta | TEXT | Call-to-action textuel |
| cta_type | TEXT | Type bouton Meta (ex: `BOOK_TRAVEL`) |
| cta_url | TEXT | URL du CTA |
| image_url | TEXT | URL de l'image |
| impact_score | INTEGER | Score 0-100 |
| supervisor_review | TEXT | JSON — verdict IA |
| scheduled_at | INTEGER | Timestamp planification |
| cost | REAL | Coût IA total ($) |
| tokens_used | INTEGER | Tokens consommés |

### `agent_jobs` + `agent_events`
Traçabilité de chaque exécution de pipeline IA.

Statuts job : `running | completed | failed | awaiting_validation`
Statuts event : `pending | running | completed | failed | skipped`

## Migrations

Les migrations sont dans `lib/db/migrations/` et s'exécutent automatiquement via `initSchema()`.
Elles sont idempotentes (sans effet si déjà appliquées).

| Migration | Contenu |
|---|---|
| 001-add-strategy | Backfill stratégies clients |
| 002-add-scheduling | `scheduled_at`, `supervisor_review`, statut `scheduled` |
| 003-add-post-insights | Insights Meta (likes, reach, etc.) |
| 004-add-ai-strategy | Stratégie IA par client |
| 005-add-agent-jobs | Tables `agent_jobs` + `agent_events` |
| 006-add-client-finance | Suivi coûts et profit par client |
| 007-add-cta-fields | `cta_type`, `cta_url`, `website_url` |
| 008-add-launch-tunnel | Tunnel de lancement client 5 étapes |
