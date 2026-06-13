# Tests — MAESTRO

## État actuel

**Il n'existe pas encore de framework de test automatisé.** Aucun test unitaire, aucun test d'intégration, aucun test E2E.

Ne jamais annoncer qu'un test passe s'il n'existe pas.

---

## Validation minimale avant chaque commit

```bash
npx tsc --noEmit    # Vérifie la compilation TypeScript
npm run lint        # ESLint — vérifie le style et les erreurs évidentes
```

Ces deux commandes doivent passer sans erreur avant tout commit.

---

## Tests manuels — Flux critiques

### Flux 1 : Génération d'un post

```
Pré-requis : client avec DA analysée, compte Meta connecté (ou non pour tester sans publication)

1. Aller sur /studio
2. Sélectionner un client
3. Saisir un brief : "Promotion happy hour vendredi soir"
4. Cocher Facebook + Instagram
5. Cliquer "Générer"
6. Attendre la fin (30-90s)
7. Vérifier : caption générée, image générée, statut 'draft' ou 'needs_revision'
8. Aller sur /validation
9. Vérifier que le post apparaît
```

**Résultat attendu** : Post visible dans /validation avec caption, image, et boutons d'action.

### Flux 2 : Approbation et publication

```
Pré-requis : Post en statut 'draft' dans /validation, compte Meta connecté

1. Aller sur /validation
2. Cliquer "Approuver" sur un post
3. Vérifier : statut devient 'approved'
4. Cliquer "Publier maintenant"
5. Attendre la réponse Meta (~5s)
6. Vérifier : statut devient 'published'
7. Vérifier sur la page Meta que le post est visible
```

**Résultat attendu** : Post publié sur Facebook et/ou Instagram.

### Flux 3 : Connexion Meta d'un nouveau client

```
Pré-requis : Client créé, CODEXRS_PUBLIC_URL configuré, App Meta avec bons scopes

1. Aller sur /clients/[id]/connections
2. Cliquer "Connecter Meta"
3. Passer MetaPreflightChecklist
4. Suivre le flux OAuth Facebook
5. Sélectionner la page FB et le compte IG
6. Vérifier : comptes sauvegardés dans /connections
```

### Flux 4 : Upload de médias et analyse DA

```
1. Aller sur /clients/[id]/library
2. Uploader 3 images (jpg/png, < 10 Mo chacune)
3. Vérifier : images affichées dans la médiathèque
4. Cliquer "Analyser DA"
5. Attendre la réponse (~15s)
6. Vérifier : DA sauvegardée (style, couleurs, ambiance renseignés)
```

---

## Tests de régression

Après chaque changement, vérifier que ces éléments fonctionnent encore :

- [ ] La sidebar s'affiche correctement (liens actifs)
- [ ] Le login fonctionne (`/login` → cookie `codexrs_session`)
- [ ] La page d'accueil charge sans erreur console
- [ ] La liste des clients s'affiche
- [ ] La création d'un client fonctionne
- [ ] La page Studio se charge (StudioForm s'affiche)

---

## Procédure de debug

### Erreur 500 sur une route API

```bash
# Vérifier les logs du serveur de dev
npm run dev
# Déclencher la route
# Lire l'erreur dans le terminal

# Si l'erreur est DB :
node -e "const db = require('./lib/db').default; console.log('DB OK')"
```

### Bug de schéma DB

```bash
# Si les colonnes ne correspondent pas :
rm maestro.db
npx tsx lib/db/seed.ts  # Recrée le schéma + données de test
```

### Erreur TypeScript

```bash
npx tsc --noEmit 2>&1 | head -50
```

---

## Plan de test pour la V2

Avant de lancer la V2 (multi-utilisateurs), il faudra implémenter :

1. **Tests unitaires** (Vitest) — agents IA avec mocks Anthropic/OpenAI
2. **Tests d'intégration** — routes API avec DB en mémoire
3. **Tests E2E** (Playwright) — flux critiques automatisés
4. **Tests de charge** — pipeline sous 10 générations simultanées
