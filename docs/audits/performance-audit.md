# Audit performances — MAESTRO

**Date** : 2026-06-13
**Statut** : Initial (Phase 0)
**Auditeur** : Claude Code (analyse statique du code)

> Règle : aucun gain de performance n'est annoncé sans mesure avant/après.
> Les chiffres ci-dessous sont des estimations basées sur l'analyse du code, pas des mesures réelles.

---

## Score global : 5/10

| Domaine | Score | Commentaire |
|---------|-------|-------------|
| Appels IA | 4/10 | Pipeline synchrone bloquant (C1) |
| Requêtes DB | 7/10 | Quelques Promise.all(), pas de N+1 évident |
| Composants React | 6/10 | Server Components bien utilisés |
| Médias | 5/10 | Pas de redimensionnement systématique |
| Bundle | 6/10 | Pas d'analyse faite |

---

## Problèmes critiques

### PERF-C1 : Pipeline synchrone bloquant (30-90s)
**Fichier** : `app/api/studio/generate-post/route.ts`, `lib/agents/pipeline.ts`
**Impact** : Timeout Vercel Hobby (60s) — génération peut échouer silencieusement.
**Mesure** : Durée typique estimée 30-90s (Account Director ~5s + Social Expert ~10s + Image Gen ~30-60s + Supervisor ~5s).
**Solution (Phase 4)** : Pipeline asynchrone avec `agent_jobs` polling.

---

## Problèmes importants

### PERF-I1 : DA régénérée à chaque génération ?
**Fichier** : `lib/agents/pipeline.ts` — à vérifier
**Question** : La Direction Artistique est-elle rechargée depuis la DB si elle existe, ou régénérée à chaque appel ?
**Impact estimé** : Si régénérée : ~$0.01 + ~5s supplémentaires par post.
**Solution** : Vérifier `client_visual_identity` avant de lancer `visual-identity` agent.
**Mesure requise** : Compter les appels à `visual-identity` sur 10 générations.

### PERF-I2 : `StudioForm.tsx` — 1335+ lignes, bundle client lourd
**Fichier** : `components/studio/StudioForm.tsx`
**Impact estimé** : Temps de parse JS plus long sur mobile. Pas mesuré.
**Solution (Phase 2)** : Découper en sous-composants (`StudioBriefForm`, `StudioPreview`, `StudioActions`).
**Mesure** : `ANALYZE=true npm run build` avant/après le découpage.

### PERF-I3 : Pages analytics sans limite de requêtes
**Fichier** : `lib/db/queries/posts.ts` — vérifier les limites sur les pages analytics
**Question** : Les requêtes de posts retournent-elles tous les posts ou utilisent-elles `limit` ?
**Impact** : Sur un client avec 500+ posts, la page analytics pourrait être lente.
**Solution** : Ajouter `limit` + pagination sur toutes les queries de liste.

### PERF-I4 : Images servies sans vérification de taille
**Fichier** : `app/api/clients/[id]/assets/route.ts`
**Impact** : Une image uploadée de 10 Mo est servie telle quelle à Meta et au frontend.
**Solution** : Redimensionner côté serveur avant stockage (sharp ou jimp).
**Mesure** : Comparer les tailles de fichiers avant/après.

---

## Points positifs

- Server Components utilisés correctement pour les pages de liste
- `lib/db/queries/` : plusieurs endroits utilisent `Promise.all()` pour des requêtes indépendantes
- `withTracking()` capture les durées et coûts de chaque agent — données disponibles pour optimiser
- Agents non bloquants (Supervisor) catchent leurs erreurs sans stopper le pipeline

---

## Métriques à mesurer

```bash
# Temps de build actuel (baseline)
time npm run build

# Analyse bundle (si next-bundle-analyzer installé)
ANALYZE=true npm run build

# Durée pipeline en dev (ajouter console.time dans pipeline.ts)
# Puis générer un post et noter la durée dans les logs
```

> Ces commandes doivent être lancées pour établir des baselines avant toute optimisation.

---

## Recommandations priorisées

| # | Problème | Priorité | Phase |
|---|---------|---------|-------|
| 1 | Pipeline asynchrone (PERF-C1) | Critique | Phase 4 |
| 2 | Vérifier cache DA (PERF-I1) | Haute | Phase 2 |
| 3 | Pagination sur queries (PERF-I3) | Haute | Phase 3 |
| 4 | Redimensionnement images (PERF-I4) | Moyenne | Phase 5 |
| 5 | Découpage StudioForm (PERF-I2) | Moyenne | Phase 2 |
