# Glossaire — MAESTRO

Termes utilisés dans l'interface, la documentation et le code de MAESTRO.

---

## A

**Account Director**
Agent IA qui analyse le profil d'un client et enrichit le brief de génération. Premier agent du pipeline.

**ADN de marque**
L'ensemble des caractéristiques d'identité d'un client : ton de communication, couleurs, audience cible, style visuel. Alimenté par le profil client et la DA.

**Agent**
Module TypeScript autonome qui appelle une API externe (Claude, OpenAI, Meta) et retourne un résultat structuré. Les agents ne touchent pas directement la base de données.

**Agent Activity Center**
Page `/agents` — tableau de bord de tous les jobs IA en cours ou terminés. Affiche les durées, coûts et erreurs.

**Asset**
Fichier média (photo, logo) uploadé pour un client dans la médiathèque.

---

## B

**Brief**
Description courte (1-3 phrases) du contenu à générer. Saisi par l'utilisateur dans le Studio.

**BottomNav**
Barre de navigation mobile affichée en bas de l'écran.

---

## C

**Caption**
Texte d'accompagnement d'un post sur les réseaux sociaux. Généré par le Social Expert.

**CODEXRS**
Nom legacy du projet (avant le rebranding MAESTRO). Certaines variables d'environnement gardent ce préfixe : `CODEXRS_PASSWORD`, `CODEXRS_PUBLIC_URL`.

**Cron**
Tâche planifiée qui s'exécute automatiquement. MAESTRO utilise Vercel Cron pour publier les posts planifiés toutes les 15 minutes.

**CTA (Call To Action)**
Appel à l'action dans un post. Exemple : "Réservez votre table" ou "Visitez notre site".

---

## D

**DA (Direction Artistique)**
Synthèse des caractéristiques visuelles d'un client : style, couleurs dominantes, ambiance, composition. Générée automatiquement à partir des médias uploadés par le `visual-identity` agent. Guide la génération d'images pour maintenir la cohérence visuelle.

---

## G

**Graph API**
API officielle de Meta (Facebook + Instagram) utilisée par MAESTRO pour publier des posts et récupérer des insights. Version utilisée : v23.0.

---

## H

**HMAC-SHA256**
Algorithme de signature cryptographique utilisé pour le cookie de session MAESTRO.

**HORECA**
Secteur des Hôtels, Restaurants et Cafés. Cible principale de MAESTRO V1.

---

## I

**Insights**
Métriques de performance d'un post Meta : portée (reach), impressions, likes, commentaires, partages, taux d'engagement.

---

## J

**Job (agent job)**
Enregistrement d'une exécution d'agent IA en base de données. Contient le statut, le coût, la durée et les events associés.

---

## M

**MAESTRO**
Nom du projet. Plateforme de production automatisée de contenus pour les réseaux sociaux, ciblant les agences HORECA.

**Meta**
Entreprise propriétaire de Facebook et Instagram. MAESTRO utilise l'API Meta pour publier du contenu.

**Médiathèque**
Collection d'assets visuels d'un client. Accessible dans `/clients/[id]/library`.

---

## P

**Page Access Token**
Token d'authentification Meta permettant de publier sur une Page Facebook ou un compte Instagram Business. Stocké dans `client_social_accounts`.

**Pipeline**
Séquence d'agents IA orchestrée pour générer un post complet : Account Director → Social Expert → Image Generator → Supervisor.

**Post**
Contenu destiné à être publié sur Facebook et/ou Instagram. Un post contient une caption, une image, des hashtags, et des métadonnées (statut, plateformes, date de publication).

---

## S

**Social Expert**
Agent IA qui génère la caption et les hashtags d'un post. Deuxième agent du pipeline.

**Statut de post**
État actuel d'un post dans son cycle de vie. Valeurs : `draft`, `needs_revision`, `approved`, `scheduled`, `published`, `failed`, `archived`.

**Studio**
Module de génération de posts. Page `/studio`.

**Supervisor**
Agent IA qui évalue la qualité d'un post généré (caption + image). Retourne un verdict : `ready`, `revise`, ou `blocked`.

---

## T

**Tracking**
Mécanisme de suivi des agents via `withTracking()`. Enregistre le coût, la durée et les events de chaque exécution en base de données.

**Turso**
Service de base de données LibSQL compatible SQLite, utilisé en production (remplacement de `maestro.db` local).

---

## V

**Validation**
Module d'approbation des posts avant publication. Page `/validation`.

**Vercel Blob**
Service de stockage de fichiers Vercel utilisé en production pour les assets clients.

**Verdict**
Résultat de l'évaluation du Supervisor : `ready` (post approuvé), `revise` (révisions suggérées), `blocked` (post non publiable).

**Visual Identity**
Agent IA qui synthétise la Direction Artistique d'un client à partir de ses médias uploadés. Aussi appelé "DA agent".

---

## W

**`withTracking()`**
Fonction utilitaire dans `lib/agents/tracking.ts` qui encapsule l'exécution d'un agent pour enregistrer ses métriques en DB.
