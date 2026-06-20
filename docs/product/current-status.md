# Statut actuel — MAESTRO

Dernière mise à jour : 2026-06-20

---

## Phase actuelle : Stabilisation V1 — Phases 1–6 complétées

### Ce qui fonctionne

| Fonctionnalité | État | Notes |
|---|---|---|
| Auth mot de passe | ✅ Fonctionnel | Cookie HMAC 30j |
| Gestion clients | ✅ Fonctionnel | CRUD complet |
| Library assets | ✅ Fonctionnel | Upload + analyse IA |
| Direction Artistique (DA) | ✅ Fonctionnel | Synthèse IA depuis les assets |
| Studio génération | ✅ Fonctionnel | 4 agents IA en pipeline |
| Validation / Supervisor | ✅ Fonctionnel | Filtres par verdict |
| Publication Meta | ✅ Fonctionnel | Facebook + Instagram |
| Calendrier | ✅ Fonctionnel | Planification + cron |
| Analytics | ✅ Fonctionnel | Stats basiques |
| Connexions Meta | ✅ Fonctionnel | OAuth + token storage |
| Tunnel de lancement | ✅ Fonctionnel | 5 étapes guidées |
| Dashboard alertes | ✅ Fonctionnel | Posts en échec + planifiés |
| Brief structurée | ✅ Fonctionnel | 4 champs guidés |
| Preview Instagram/Facebook | ✅ Fonctionnel | Prévisualisation réelle |
| Confirmation publication | ✅ Fonctionnel | Modal avec résumé Supervisor |
| Régénération partielle | ✅ Fonctionnel | Texte uniquement + instruction |
| PublishErrorHint | ✅ Fonctionnel | Aide contextuelle erreurs Meta |

### Phases V1 complétées

| Phase | Contenu | État |
|---|---|---|
| Phase 1 | Nettoyage code mort (7 pages, 3 routes API, store, mock-data, ollama) | ✅ |
| Phase 2 | Découpage StudioForm.tsx → 6 sous-composants (620 → 347 lignes) | ✅ |
| Phase 3 | Chiffrement AES-256-GCM tokens Meta + CSRF + headers HTTP | ✅ |
| Phase 4 | Génération asynchrone (after() + polling + jobId) | ✅ |
| Phase 5 | Agent Activity Center + AutoRefresh | ✅ |
| Phase 6 | RETURNING * DB + batch identity + pipeline parallèle + next/image | ✅ |
| Business Profile + Playbooks | Types client, formulaires new/edit, Vertical Playbooks HORECA | ✅ |
| Test Drive Cockpit | Panneau 6 étapes sur la fiche client, % de complétion | ✅ |
| Studio orienté objectif business | Account Director + Social Expert injectent l'objectif, canaux de conversion et playbook vertical | ✅ |
| Dashboard croissance | Page `/clients/[id]/growth` — santé de trajectoire, KPIs mensuels, tendance 3 mois, recommandations actionnables | ✅ |

### Note : proxy.ts

`proxy.ts` est le nom CORRECT pour Next.js 16.2.6+ (Turbopack). `middleware.ts` est déprécié dans cette version.

### Ce qui n'existe pas encore

- Portail client externe
- Multi-utilisateurs / rôles
- TikTok / LinkedIn
- Génération vidéo
- Tests automatisés
- Versioning des posts
- Revenue Loop minimale (mesurer si l'objectif business est atteint post par post via conversion tracking)
- Revenue Loop minimale (conversion tracking réel : appels, réservations, DMs générés par post)
- AI Router / Model Router : connecter plusieurs IA et choisir automatiquement le meilleur modèle selon mission, coût, qualité, vitesse et marge client. Spec roadmap : `CODEX_SPECS/139-ai-model-router-roadmap.md`

---

## Branches actives

| Branche | Contenu |
|---|---|
| `main` | Branche production |
| `claude/maestro-project-handoff-L67ha` | Session courante (Studio V2 + dashboard) |
| `docs/phase0-infrastructure` | Phase 0 en cours (ce commit) |
| `codex/studio-v2-specs-009-012` | Studio V2 implémenté par Codex |
| `codex/mvp-hardening` | Durcissement MVP (ancienne) |

---

## Infrastructure

| Composant | État |
|---|---|
| Dev local | ✅ Port 3010 |
| DB locale | ✅ `./maestro.db` LibSQL |
| DB production | 🔲 Turso (à configurer) |
| Stockage images | ✅ Local dev, Vercel Blob prod |
| Déploiement | 🔲 Vercel (à lier) |
| Vercel Cron | ✅ Configuré `vercel.json` |
