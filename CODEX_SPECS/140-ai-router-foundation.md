# Spec 140 — IA SELECT Foundation

## Objectif
Créer une première fondation parallèle pour **IA SELECT**, le futur routeur IA de Maestro, sans modifier le pipeline Studio actuel.

## Ce qui est livré
- Types centraux :
  - `AIProvider`
  - `AICapability`
  - `AITaskType`
  - `AIRoutingDecision`
- Registre providers :
  - Anthropic
  - OpenAI
  - Gemini
  - Mistral
  - Groq
  - Ollama
  - Replicate
  - Ideogram
  - Luma
- Routeur consultatif :
  - choix provider/modèle par type de mission ;
  - fallback prévu ;
  - coût estimé ;
  - raison de la décision ;
  - alertes si provider non configuré.
- UI :
  - `/settings/ai`
  - carte par provider ;
  - tableau des décisions de routing prévues.

## Important
Cette phase ne remplace pas encore les appels existants aux agents.

Les agents actuels continuent d'utiliser leurs intégrations historiques :
- Claude pour stratégie/caption/supervision/analyse ;
- OpenAI pour image ;
- Luma si configuré pour vidéo.

## Prochaine phase
Brancher progressivement les agents runtime sur `routeAITask()` :
1. `social-expert`
2. `supervisor`
3. `image-generator`
4. `performance-analyst`
5. `video-creator`

Chaque branchement devra conserver :
- fallback actuel ;
- journalisation coût/modèle ;
- pas d’exposition de secrets frontend ;
- validation critique jamais routée vers un modèle low-cost.
