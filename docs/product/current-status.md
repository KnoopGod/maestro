# Statut actuel — MAESTRO

Dernière mise à jour : 2026-06-13

---

## Phase actuelle : Stabilisation V1 — Phase 1 en cours

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

### Ce qui est en travaux

| Fonctionnalité | État | Priorité |
|---|---|---|
| Génération asynchrone | ⚠️ Risque critique | Phase 4 |
| Chiffrement tokens Meta | ⚠️ Risque critique | Phase 3 |
| Suppression pages legacy | ✅ Fait Phase 1 | proxy→middleware, 7 pages, ollama |
| Découpage StudioForm.tsx | 🔄 Phase 2 | Prochain |
| CSRF protection | ⚠️ Important | Phase 3 |

### Ce qui n'existe pas encore

- Portail client externe
- Multi-utilisateurs / rôles
- TikTok / LinkedIn
- Génération vidéo
- Tests automatisés
- Versioning des posts

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
