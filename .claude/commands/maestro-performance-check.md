---
description: Vérifie les performances d'un module MAESTRO. Identifie les appels IA redondants, requêtes inefficaces et composants lourds.
---

# Vérification performances MAESTRO

Analyse les performances des fichiers mentionnés.

**Règle absolue : ne jamais annoncer un gain sans mesure avant/après.**

## Procédure

1. Identifier les fichiers à analyser
2. Lancer le sous-agent `performance-reviewer`
3. Mesurer les métriques de base si possible
4. Proposer des optimisations avec leur impact estimé

## Checklist performance MAESTRO

### Appels IA (coûteux)
- [ ] La DA (`visual-identity`) est-elle rechargée si elle existe déjà ?
- [ ] Des agents s'exécutent-ils séquentiellement alors qu'ils pourraient être parallèles ?
- [ ] Y a-t-il des appels Claude pour des données déjà disponibles en DB ?

### Requêtes DB
- [ ] Les requêtes indépendantes utilisent-elles `Promise.all()` ?
- [ ] Y a-t-il des requêtes N+1 dans les pages qui listent des éléments ?
- [ ] Les limites (`limit:`) sont-elles raisonnables ?

### Composants React
- [ ] Les Server Components fetchent-ils en `Promise.all()` ?
- [ ] Des `'use client'` sont-ils utilisés sans nécessité (pas d'état ni d'événement) ?
- [ ] Y a-t-il des imports lourds (`framer-motion`, `recharts`) dans des pages simples ?

### Médias
- [ ] Les images utilisent-elles `<Image>` de Next.js (pas `<img>`) ?
- [ ] Y a-t-il des images sans `loading="lazy"` en dehors du fold initial ?
- [ ] Des assets > 1Mo sont-ils servis sans compression ?

### Pipeline de génération
- [ ] La route `generate-post` répond-elle avant 60s (timeout Vercel) ? (problème C1 connu)

## Mesures disponibles

```bash
# Temps de build
time npm run build

# Analyse du bundle (si next-bundle-analyzer installé)
ANALYZE=true npm run build
```

## Format de réponse attendu

Pour chaque problème trouvé :
```
Problème : [description]
Fichier : [chemin:ligne]
Impact estimé : [faible/moyen/élevé]
Solution : [description]
Comment mesurer : [avant/après]
```
