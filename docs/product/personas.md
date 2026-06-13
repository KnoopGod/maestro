# Personas — MAESTRO

## Persona 1 — Utilisateur V1 : L'agence de communication HORECA

**Nom** : Marie Dubois
**Rôle** : Responsable de production dans une petite agence
**Âge** : 35 ans
**Compétences** : Bonne maîtrise des outils en ligne, pas développeuse

### Contexte

Marie gère 12 clients restauration/hôtellerie pour son agence. Elle doit produire 3-4 posts par semaine et par client — soit 36-48 posts hebdomadaires. Avec ses outils actuels (Canva + ChatGPT + Buffer), chaque post lui prend 45 minutes.

### Objectifs

- Produire plus de contenu en moins de temps
- Maintenir la cohérence visuelle de chaque client
- Ne pas avoir à apprendre à coder ou utiliser des APIs
- Valider chaque post avant qu'il parte — elle reste responsable

### Frustrations

- "Je passe plus de temps à reformater les textes de ChatGPT qu'à les corriger"
- "Canva c'est bien mais je dois recréer le style à chaque fois"
- "Buffer n'est pas connecté à mon workflow de génération"

### Comportement avec MAESTRO

- Lance 5-10 générations en début de semaine
- Approuve rapidement les bons posts, corrige les autres
- Planifie tout le contenu de la semaine en 2 heures
- Revient vérifier les performances le vendredi

### Ce que MAESTRO doit faire pour Marie

- Générer des posts cohérents avec l'identité du client sans explications complexes
- Afficher un progrès clair pendant la génération (pas de page blanche 60s)
- Permettre de corriger rapidement une caption sans tout régénérer
- Donner un accès simple aux métriques de base (portée, engagement)

---

## Persona 2 — Utilisateur V2 : Le client final (futur portail client)

**Nom** : Jean-Pierre Renard
**Rôle** : Patron d'un restaurant gastronomique
**Âge** : 52 ans
**Compétences** : Utilise son téléphone pour tout, très peu à l'aise avec les outils digitaux

### Contexte (V2)

Jean-Pierre veut pouvoir voir et approuver les posts que son agence prépare pour lui, directement sur son téléphone. Il ne veut pas aller sur Facebook Ads ou Meta Business Suite.

### Objectifs V2

- Voir les posts prévus pour son restaurant
- Approuver ou commenter en 2 taps
- Recevoir une notification quand un post est publié

### Comportement

- Consulte son téléphone 2-3 fois par jour
- Jamais sur desktop
- Réagit au contenu visuellement, pas aux textes techniques

### Implications pour le design V2

- Interface ultra-simplifiée (mobile-first)
- Pas d'accès aux paramètres techniques (agents, coûts, etc.)
- Notifications push
- Aperçu du post tel qu'il apparaîtra sur Instagram

---

## Persona 3 — Administrateur : Bradley (V1 seulement)

**Rôle** : Créateur et unique utilisateur de MAESTRO V1
**Compétences** : Développeur full-stack, comprend le système en profondeur

### Besoins

- Visibilité complète sur les coûts IA (`/usage`)
- Accès aux logs des agents (`/agents`)
- Capacité à débugger une connexion Meta depuis l'interface
- Contrôle total sur le contenu avant publication

### Ce que Bradley ne veut pas

- Être bloqué par une UI qui masque les erreurs techniques
- Devoir aller dans la DB pour corriger un état
- Des changements automatiques sur `main` sans son accord
