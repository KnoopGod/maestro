---
description: Procédure complète pour implémenter une fonctionnalité MAESTRO en suivant le workflow obligatoire en 12 étapes.
---

# Workflow d'implémentation de fonctionnalité MAESTRO

Suis ces étapes dans l'ordre. Ne passe pas à l'étape suivante sans avoir complété la précédente.

## Étape 1 — Lire la spécification

Lis le fichier de spec dans `CODEX_SPECS/` ou la description fournie par l'utilisateur.  
Si aucune spec n'existe, demande une description précise avant de continuer.

## Étape 2 — Analyser l'existant

- Lire `CLAUDE.md` (priorités, règles, interdictions)
- Identifier les fichiers existants liés à la fonctionnalité
- Comprendre le flux de données actuel
- Identifier les dépendances (DB, agents, composants)

## Étape 3 — Identifier les fichiers concernés

Lister précisément :
- Fichiers à créer (nouveaux)
- Fichiers à modifier (avec les lignes concernées)
- Fichiers impactés indirectement (régressions potentielles)
- Migrations DB nécessaires

## Étape 4 — Identifier les risques

Évaluer pour chaque changement :
- Risque de régression sur l'existant
- Risque de casser la DB (migrations)
- Risque de casser l'auth ou les permissions
- Dépendances vers des modules legacy

## Étape 5 — Proposer un plan

Écrire un plan clair :
```
Objectif : [une phrase]
Approche : [comment]
Fichiers : [liste]
Risques : [liste]
```
Attendre la validation de Bradley avant de continuer si le changement est important.

## Étape 6 — Créer une branche dédiée

```bash
git checkout -b feature/<nom-descriptif>
```

Ne jamais implémenter directement sur `main` ou sur la branche courante si elle est partagée.

## Étape 7 — Implémenter (une seule phase)

- Une responsabilité par fichier
- TypeScript strict (pas de `any` sans justification)
- Textes UI en français, code en anglais
- Agents : input typé, output typé, coût tracé, erreur gérée

## Étape 8 — Tester

```bash
npx tsc --noEmit   # 0 erreur
npm run lint       # 0 erreur
```

Tester manuellement le flux concerné.

## Étape 9 — Documenter

- Mettre à jour `docs/product/current-status.md`
- Enregistrer les décisions dans `docs/product/decisions.md` si applicable
- Mettre à jour `docs/audits/technical-audit.md` si un bug a été corrigé

## Étape 10 — Faire auditer (si changement important)

Utiliser les sous-agents selon le type de changement :
- `architecture-reviewer` si nouveau module ou refactoring
- `security-reviewer` si nouvelle route API ou gestion de tokens
- `ux-reviewer` si nouvelle page ou composant
- `test-engineer` pour valider avant commit

## Étape 11 — Corriger

Appliquer les corrections issues de l'audit. Relancer `npx tsc --noEmit && npm run lint`.

## Étape 12 — Committer et pusher

```bash
git add <fichiers spécifiques>
git commit -m "feat(scope): description courte"
git push -u origin <branche>
```

Produire le rapport final au format CLAUDE.md.
