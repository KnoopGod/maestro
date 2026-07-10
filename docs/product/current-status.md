# Statut actuel — MAESTRO

Dernière vérification : 2026-07-10

## Phase actuelle

**V1 prête pour un premier parcours client supervisé.**

La priorité n'est plus d'ajouter des modules : elle est de valider le tunnel
réel avec un client, corriger les blocages rencontrés, puis mesurer les
résultats commerciaux.

## Production

| Élément | État |
|---|---|
| URL | `https://maestro-green.vercel.app` |
| Branche | `main` |
| Hébergement | Vercel |
| Base | Turso |
| Médias | Vercel Blob |
| Santé | `ok: true` après authentification |
| Authentification | Mot de passe administrateur + cookie HMAC |
| Publication | Facebook et Instagram via Meta |
| Génération vidéo IA | Inactive tant que `LUMA_API_KEY` n'est pas configurée |

Les contrôles Anthropic, OpenAI, Blob, Meta, chiffrement, médias publics et
Turso sont actifs en production.

## Tunnel validable

```text
Client
→ profil business et stratégie
→ Library et direction artistique
→ brief Studio
→ génération asynchrone
→ supervision et validation
→ planification ou publication Meta
→ analytics
```

## Fonctionnalités disponibles

| Fonctionnalité | État |
|---|---|
| Gestion des clients | Fonctionnel |
| Profil business et playbooks verticaux | Fonctionnel |
| Library, uploads et analyse IA | Fonctionnel |
| Synthèse de direction artistique | Fonctionnel |
| Studio texte + image | Fonctionnel |
| Brief guidé et régénération partielle | Fonctionnel |
| Pipeline asynchrone `after()` + polling | Fonctionnel |
| Supervisor et file de validation | Fonctionnel |
| Prévisualisations Facebook et Instagram | Fonctionnel |
| Calendrier et publication planifiée | Fonctionnel |
| Publication Facebook et Instagram | Fonctionnel |
| Centre d'activité des agents | Fonctionnel |
| Analytics, croissance et coûts IA | Fonctionnel |
| Suppressions groupées de posts | Fonctionnel |
| Chiffrement des tokens Meta | Fonctionnel |
| Rapport mensuel client (deltas, top posts, KPIs verticale) | Fonctionnel |
| Module Campagnes Meta Ads / Google Ads (phase 1 assistée) | Fonctionnel |

Le rapport mensuel et le module Campagnes (specs 140 et 141) sont mergés dans
`main` (PR #13 à #17) et déployés en production.

## Fondations présentes mais non validées pour commercialisation

- portail client externe ;
- multi-utilisateurs et rôles ;
- publication LinkedIn ;
- génération vidéo Luma ;
- webhooks et audit avancé.

Ces fondations ne doivent pas être présentées comme terminées avant un test
dédié de sécurité et de bout en bout.

## Travaux différés

- IA SELECT / routeur multi-modèles ;
- queue durable avec reprise automatique des jobs ;
- mesure des conversions réelles : réservations, appels, messages et chiffre
  d'affaires ;
- versioning des posts ;
- tests automatisés du tunnel critique ;
- TikTok et Google Business.

## Limites connues

- `after()` évite le timeout de la requête utilisateur, mais ne remplace pas
  une queue durable. `cleanup-jobs` marque les jobs bloqués sans les relancer.
- La génération vidéo IA nécessite `LUMA_API_KEY`.
- Le premier client doit rester en validation humaine avant toute publication
  automatique.

## Prochaine validation

Réaliser avec Pink House :

1. vérifier le profil business et la stratégie ;
2. vérifier les médias et la DA ;
3. générer un post Facebook et un contenu Instagram ;
4. contrôler le verdict du Supervisor ;
5. publier après validation ;
6. vérifier les identifiants Meta et les premiers insights.
