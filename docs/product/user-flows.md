# Flux utilisateurs — MAESTRO

## Flux 1 — Onboarding d'un nouveau client

```
/clients → "Nouveau client"
    │
    ▼
/clients/new
    Formulaire : nom, type (restaurant/hôtel/bar), description,
                 audience cible, ton de communication
    → createClient() Server Action
    │
    ▼
/clients/[id]/setup
    1. Compléter le profil (couleurs, logo, site web)
    2. Uploader 3-5 photos représentatives → /library
    3. Cliquer "Analyser la DA" → visual-identity agent
    4. Vérifier la DA générée
    │
    ▼
/clients/[id]/connections
    → MetaPreflightChecklist
    → Connexion OAuth Meta
    → Sélection page FB + compte IG
    │
    ▼
Client prêt → /studio
```

**Durée estimée** : 15-20 minutes pour un nouveau client

---

## Flux 2 — Production hebdomadaire de posts

```
/studio
    │
    ├─ Sélectionner client
    ├─ Saisir brief OU cliquer sur une suggestion PostIdeasPanel
    ├─ Cocher plateformes (Facebook / Instagram)
    └─ Cliquer "Générer"
         │
         ▼
    [30-90 secondes]
    Pipeline : Account Director → Social Expert → Image Generator → Supervisor
         │
         ▼
    Résultat affiché :
    ├─ Caption + hashtags
    ├─ Image générée
    └─ Verdict supervisor
         │
    ┌────┴────────────────────────────────┐
    │                                     │
    ▼                                     ▼
Approuver                           Régénérer caption / Rejeter
    │
    ▼
/validation → planifier ou publier
```

---

## Flux 3 — Publication d'un post

```
/validation
    │
    ├─ Voir liste des posts 'approved'
    └─ Pour chaque post :
         │
         ├─ "Planifier" → choisir date/heure → statut 'scheduled'
         │       → Vercel Cron publie automatiquement à l'heure choisie
         │
         └─ "Publier maintenant"
                 │
                 ▼
         POST /api/studio/publish-post
                 │
                 ▼
         meta-publisher.ts
         ├─ Facebook : graph.facebook.com/v23.0/{pageId}/feed
         └─ Instagram : container + publish
                 │
                 ▼
         statut 'published' ✓
         ou
         statut 'failed' → PublishErrorHint
```

---

## Flux 4 — Publication planifiée automatique (Cron)

```
Vercel Cron (toutes les 15 min)
    │
    ▼
POST /api/cron/publish-due
    │
    ▼
Récupère posts WHERE status='scheduled' AND scheduled_at <= now()
    │
    ▼
Pour chaque post → publish-pipeline → meta-publisher
    │
    ├─ Succès → statut 'published', platform_post_ids mis à jour
    └─ Erreur → statut 'failed', error_message sauvegardé
```

---

## Flux 5 — Synchronisation des insights Meta

```
/clients/[id]/analytics  (ou /analytics global)
    │
    ▼
FetchInsightsButton
    │
    ▼
POST /api/posts/[id]/insights
    │
    ▼
Graph API : GET /{postId}/insights
    │
    ▼
Mise à jour post : reach, engagement_rate, likes, comments, shares
```

---

## Flux 6 — Debug d'une erreur de publication

```
Post en statut 'failed'
    │
    ▼
/validation → PublishErrorHint affiché
    │
    ├─ Code 190 (token expiré)
    │       → /clients/[id]/connections → reconnecter Meta
    │
    ├─ Code 200 (permission manquante)
    │       → /api/meta/debug-token → vérifier scopes
    │
    └─ Image non accessible
            → vérifier CODEXRS_PUBLIC_URL dans les settings Vercel
```

---

## Points de friction identifiés

| Flux | Friction | Cause | Phase de correction |
|------|----------|-------|---------------------|
| Flux 2 | Attente sans feedback 30-90s | Pipeline synchrone | Phase 4 |
| Flux 1 | Connexion Meta requiert developer mode | Permissions Meta complexes | Documentation |
| Flux 3 | Pas de prévisualisation du post tel qu'il apparaîtra | Pas d'embed Meta | Phase 5 |
| Flux 6 | Messages d'erreur Meta cryptiques | API Meta non localisée | Phase 2 |
