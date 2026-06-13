# Processus de release — MAESTRO

## Convention de branches

```
main                   — production stable
feature/<nom>          — nouvelle fonctionnalité
fix/<nom>              — correction de bug
refactor/<nom>         — refactoring sans changement de comportement
performance/<nom>      — optimisation mesurable
security/<nom>         — correction de sécurité
docs/<nom>             — documentation uniquement
```

## Checklist avant chaque commit

```bash
npx tsc --noEmit    # 0 erreur TypeScript
npm run lint        # 0 erreur ESLint
```

## Checklist avant de pusher une branche

- [ ] TypeScript : `npx tsc --noEmit` → 0 erreur
- [ ] Lint : `npm run lint` → 0 erreur
- [ ] Build : `npm run build` (si changements importants)
- [ ] Tests manuels : flux concernés vérifiés
- [ ] Pas de `console.log` oublié avec des données sensibles
- [ ] Pas de secret dans le code ou les commits
- [ ] Pas de migration DB cassante (vérifier l'idempotence)
- [ ] `docs/product/current-status.md` mis à jour si phase complétée

## Checklist avant de merger dans main

- [ ] Toutes les vérifications ci-dessus
- [ ] PR créée sur GitHub
- [ ] Accord explicite de Bradley
- [ ] Preview Vercel testée si disponible

## Format des commits

```
type(scope): description courte

Corps optionnel : explication du pourquoi si non évident.
Fichiers modifiés : liste si migration ou risque.
```

Types : `feat`, `fix`, `refactor`, `perf`, `security`, `docs`, `chore`

Exemples :
```
feat(studio): régénération partielle avec instruction utilisateur
fix(validation): page crash sur SQLITE no such column
docs(phase0): infrastructure CLAUDE.md + docs/ + agents + skills
```

## Numérotation des specs Codex

Les specs dans `CODEX_SPECS/` sont numérotées séquentiellement.
Prochain numéro disponible : **013**

## Historique des releases

| Date | Phase | Branche | Contenu |
|---|---|---|---|
| 2026-06 | Phase 0 | `docs/phase0-infrastructure` | CLAUDE.md, docs/, agents, skills, hooks |
| 2026-06 | Studio V2 | `claude/maestro-project-handoff-L67ha` | Brief structurée, preview, confirmation, erreurs guidées |
| 2026-05 | MVP | `codex/mvp-hardening` | Durcissement pipeline, publication Meta |
