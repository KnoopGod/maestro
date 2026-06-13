---
description: Vérifie la sécurité d'un module ou d'une route MAESTRO. Lance le security-reviewer sur les fichiers concernés.
---

# Vérification sécurité MAESTRO

Lance une analyse sécurité sur les fichiers mentionnés ou sur l'ensemble du projet.

## Procédure

1. Identifier les fichiers à auditer (routes API, middleware, queries, agents)
2. Lancer le sous-agent `security-reviewer` sur ces fichiers
3. Vérifier la checklist ci-dessous
4. Produire le rapport

## Checklist de sécurité MAESTRO

### Authentification
- [ ] Toutes les routes API (sauf `PUBLIC_PATHS`) passent par le middleware
- [ ] `proxy.ts` n'a pas de nouvelles exceptions non justifiées
- [ ] Le cookie de session est httpOnly + secure en prod + sameSite: lax minimum

### Tokens sociaux
- [ ] Aucun token Meta n'est logué ou retourné dans une réponse API
- [ ] `access_token` et `refresh_token` ne sont jamais exposés au frontend
- [ ] (Phase 3) Les tokens sont chiffrés au repos

### Validation des entrées
- [ ] Les IDs de route (`[id]`) sont vérifiés avant requête DB
- [ ] Les corps JSON sont parsés avec try/catch
- [ ] Les URLs fournis par l'utilisateur sont validées (pas de `javascript:`, `file:`, etc.)
- [ ] Les uploads vérifient le type MIME côté serveur

### Secrets
- [ ] Aucune clé API dans le code
- [ ] Aucun `console.log` avec des données sensibles
- [ ] `.env.local` non committé (vérifié dans `.gitignore`)

### Routes sensibles
- [ ] `/api/cron/publish-due` protégée par `CRON_SECRET` ou session
- [ ] `/api/meta/connect` protégée par middleware
- [ ] Les routes DELETE/PATCH vérifient l'existence de la ressource

## Si des problèmes sont trouvés

Classer par gravité :
- **Critique** : action immédiate requise avant tout commit
- **Important** : à corriger dans la prochaine phase
- **Acceptable V1** : documenté dans `docs/audits/security-audit.md`
