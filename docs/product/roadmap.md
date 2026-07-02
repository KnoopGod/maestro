# Roadmap MAESTRO

---

## V1 — Stabilisation

### Phase 0 — Infrastructure et règles ✅ terminée
- CLAUDE.md revu et complet
- Structure docs/ créée
- Sous-agents Claude Code créés
- Skills MAESTRO créés
- Hooks configurés

### Phase 1 — Nettoyage code mort ✅ terminée
- 7 pages legacy supprimées (`/dashboard`, `/models`, `/task-router`,
  `/token-economy`, `/work-memory`, `/resume-for-claude`, `/setup-guide`)
- `store/useCommandCenterStore.ts` supprimé
- `lib/mode-config.ts` et `lib/mock-data/` supprimés
- Package `ollama` et sa route API supprimés
- **Non fait, volontairement** : `proxy.ts` n'est **pas** renommé en
  `middleware.ts` — dans Next.js 16.2.6 (Turbopack), `proxy.ts` est le nom
  correct ; `middleware.ts` y est déprécié (voir CLAUDE.md).

### Phase 2 — Découpage StudioForm.tsx ✅ terminée
- `StudioForm.tsx` réduit à 463 lignes, avec 14 sous-composants extraits
  dans `components/studio/` (`BriefCard`, `ContentTypeCard`,
  `ClientSelectorCard`, `PlatformsCard`, `MediaPreview`,
  `GuidedBriefField`, `CtaFacebookSection`, `EditableHashtagChips`,
  `ImageVisualCard`, `CaptionResult`, `PostIdeasPanel`, `AgentWorkPlan`,
  `StudioResultPanel`, `BatchStudioForm`)
- Comportement utilisateur inchangé
- Reste légèrement au-dessus du seuil de 400 lignes (règle CLAUDE.md) —
  découpage supplémentaire possible mais non prioritaire

### Phase 3 — Sécurité tokens et sessions ✅ terminée
- Chiffrement AES-256-GCM des tokens Meta (actif si `MAESTRO_ENCRYPTION_KEY`
  est configurée — voir DT-06)
- Protection CSRF pragmatique : cookie `sameSite=strict` + validation
  `Origin` sur les méthodes mutantes dans `proxy.ts` (voir DT-07)
- Headers de sécurité dans `next.config.ts` (CSP, HSTS, X-Frame-Options,
  Referrer-Policy, Permissions-Policy)
- Suite V2 : token CSRF dédié avant l'ouverture multi-utilisateur (voir DT-07)

### Phase 4 — Génération asynchrone ✅ terminée
- Retour immédiat d'un `jobId` depuis `generate-post`
- Exécution du pipeline via `after()`
- Polling de suivi de progression

### Phase 5 — Agent Activity Center ✅ terminée
- Dashboard de supervision des agents en temps réel
- Durée, coût, modèle, étape courante, erreurs

### Phase 6 — Performance (à faire — prochaine phase V1)
- Mesurer les temps de chargement actuels des pages clés avant toute
  optimisation (règle CLAUDE.md : jamais annoncer un gain sans mesure)
- Identifier les requêtes DB et appels IA redondants
- Optimiser (`Promise.all`, cache, images) uniquement là où la mesure
  montre un problème réel

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
