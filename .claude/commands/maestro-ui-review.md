---
description: Audite l'UX d'une page ou d'un composant MAESTRO du point de vue d'un utilisateur débutant.
---

# Revue UX — MAESTRO

Lance une revue UX complète sur la page ou le composant mentionné.

## Procédure

1. Lire le code de la page/composant
2. Lancer le sous-agent `ux-reviewer`
3. Vérifier la checklist ci-dessous
4. Produire les recommandations priorisées

## Checklist UX MAESTRO

### Clarté et compréhension
- [ ] Le titre de la page explique en français simple ce qu'elle fait
- [ ] Les boutons d'action primaire sont clairement identifiables
- [ ] Pas de jargon technique non expliqué (`DA`, `CTA`, `HMAC`, etc.)
- [ ] Les abréviations utilisées dans l'UI ont un `title` ou un tooltip

### États de la page
- [ ] **État vide** : message utile + bouton d'action CTA
- [ ] **État chargement** : indicateur visible, boutons désactivés
- [ ] **État erreur** : message compréhensible + action de récupération
- [ ] **État succès** : confirmation claire après action importante

### Formulaires et interactions
- [ ] Les champs obligatoires sont identifiés
- [ ] Les erreurs de validation sont affichées près du champ concerné
- [ ] Les actions irréversibles (publication, suppression) demandent confirmation
- [ ] Le bouton de soumission est désactivé pendant le traitement

### Navigation
- [ ] L'utilisateur peut revenir en arrière depuis toutes les pages
- [ ] La page active est mise en évidence dans la sidebar
- [ ] Les liens sont descriptifs (pas "cliquer ici")

### Accessibilité minimale
- [ ] `aria-label` sur les icônes sans texte
- [ ] `title` sur les éléments qui nécessitent une explication au survol
- [ ] Le focus clavier est visible

### Mobile (responsive)
- [ ] La page est utilisable sur mobile (BottomNav présent)
- [ ] Les tableaux ou grilles s'adaptent aux petits écrans
- [ ] Pas d'overflow horizontal non intentionnel

## Format de réponse attendu

```
Page auditée : [nom]

Ce qui fonctionne bien :
- [point positif 1]

Problèmes bloquants :
1. [description + impact sur l'utilisateur]

Problèmes importants :
1. [description + impact]

Recommandations :
1. [action concrète — fichier:ligne]
```
