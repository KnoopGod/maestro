# Roadmap MAESTRO

---

## V1 — Stabilisation (en cours)

### Phase 0 — Infrastructure et règles ✅ en cours
- CLAUDE.md revu et complet
- Structure docs/ créée
- Sous-agents Claude Code créés
- Skills MAESTRO créés
- Hooks configurés

### Phase 1 — Nettoyage code mort
- Supprimer 7 pages legacy (`/dashboard`, `/models`, etc.)
- Supprimer `store/useCommandCenterStore.ts`
- Supprimer `lib/mode-config.ts` et `lib/mock-data/`
- Renommer `proxy.ts` → `middleware.ts`
- Supprimer package `ollama` et sa route API
- Nettoyer `types/index.ts` (types legacy)

### Phase 2 — Découpage StudioForm.tsx
- Extraire ~15 sous-composants depuis les 1 335 lignes actuelles
- Sans changer le comportement utilisateur

### Phase 3 — Sécurité tokens et sessions
- Chiffrement AES-256-GCM des tokens Meta
- Protection CSRF
- Headers de sécurité dans `next.config.ts` (CSP, HSTS, X-Frame-Options)

### Phase 4 — Génération asynchrone (critique)
- Retourner un `jobId` immédiatement depuis `generate-post`
- Exécuter le pipeline en arrière-plan
- Polling ou SSE pour le suivi de progression
- Résoudre le risque de timeout Vercel

### Phase 5 — Agent Activity Center
- Dashboard de supervision des agents en temps réel
- Durée, coût, modèle, étape courante, erreurs

### Phase 6 — Performance
- Mesure et optimisation des temps de chargement
- Cache, `Promise.all`, images optimisées

---

## V2 — SaaS (future)

### Multi-utilisateurs
- Table `users` + `organizations` + `memberships` + `roles`
- Sessions par utilisateur avec audit_log
- Migration progressive depuis l'auth actuelle

### Portail client
- Accès externe sécurisé par token pour validation
- Aperçu des posts en attente de validation client
- Commentaires et demandes de modification

### Facturation
- Plans d'abonnement
- Suivi de consommation IA par client
- Export facturation

### Nouvelles plateformes
- TikTok (vidéo verticale)
- LinkedIn (B2B)
- Google Business (avis + posts)

### Creative Media Factory
- Génération vidéo (Luma, Runway)
- Agents spécialisés : Brand Analyst, Media Decision Engine, Model Router, Cost Controller
- Adaptation automatique des formats par plateforme
