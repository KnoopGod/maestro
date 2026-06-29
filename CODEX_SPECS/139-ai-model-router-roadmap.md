# Spec 139 — Roadmap IA SELECT / Model Router

## Contexte
Maestro doit devenir un cockpit de croissance digitale pour commerces physiques. Pour garder une bonne marge tout en utilisant les meilleurs modèles selon les missions, il faut prévoir une architecture **IA SELECT**.

L'objectif n'est pas de connecter toutes les IA immédiatement. L'objectif est de créer une fondation claire pour choisir automatiquement le bon fournisseur IA selon la tâche, le coût, la qualité attendue et le niveau de risque.

## Objectif
Préparer une fondation progressive pour router les missions IA de Maestro vers le meilleur modèle disponible, sans casser le MVP actuel.

Nom produit retenu : **IA SELECT**.

## Vision produit
Maestro doit pouvoir connecter plusieurs fournisseurs IA :
- Anthropic
- OpenAI
- Google Gemini
- Mistral
- Groq
- Ollama/local
- Replicate/Flux
- Ideogram
- Adobe Firefly
- Luma/Runway/Kling pour vidéo

Le système choisit ensuite automatiquement le modèle selon :
- type de mission ;
- niveau de qualité attendu ;
- coût maximum ;
- vitesse souhaitée ;
- besoin vision/image/vidéo ;
- sensibilité du client au budget ;
- risque business ou réputationnel ;
- disponibilité des clés API ;
- modèle fallback en cas d'erreur.

## Architecture cible

### 1. Providers
Créer une représentation centralisée des fournisseurs IA.

Exemples :
- `anthropic`
- `openai`
- `gemini`
- `mistral`
- `groq`
- `ollama`
- `replicate`
- `luma`

Chaque provider doit déclarer :
- nom ;
- statut configuré/non configuré ;
- variables d'environnement nécessaires ;
- capacités ;
- coût estimé ;
- modèles disponibles ;
- limites connues.

### 2. Capabilities
Définir les capacités métier, pas seulement les noms de modèles.

Exemples :
- `strategy`
- `copywriting`
- `quality_review`
- `vision_analysis`
- `image_generation`
- `image_editing`
- `video_generation`
- `data_analysis`
- `low_cost_draft`
- `local_private_task`

### 3. Task Types
Mapper les missions Maestro vers des types de tâches.

Exemples :
- stratégie mensuelle client premium ;
- génération caption simple ;
- contrôle final avant publication ;
- analyse DA ;
- analyse performance ;
- génération image ;
- amélioration image issue de Library ;
- génération vidéo/reel ;
- résumé document client ;
- réponse à un avis Google ;
- estimation coûts/marge.

### 4. Routing Rules
Créer une logique de choix.

Exemples :
- tâche stratégique critique → modèle premium ;
- caption simple → modèle rapide/moins cher ;
- validation finale → jamais low-cost ;
- image → provider image ;
- vidéo → provider vidéo ;
- tâches répétitives → modèle local ou low-cost ;
- client premium → qualité prioritaire ;
- client low budget → coût prioritaire.

### 5. Cost Controller
Le Profit Controller doit pouvoir influencer le router.

Exemples :
- refuser une génération vidéo si la marge client est insuffisante ;
- router les drafts simples vers un modèle moins cher ;
- réserver Claude/OpenAI premium aux décisions importantes ;
- journaliser le coût estimé vs coût réel.

## Fichiers à créer plus tard
Ne pas implémenter sans spec dédiée. Proposition :

- `lib/ai/providers.ts`
- `lib/ai/capabilities.ts`
- `lib/ai/router.ts`
- `lib/ai/costs.ts`
- `lib/ai/types.ts`
- `app/settings/ai/page.tsx`
- `components/settings/AIProviderCard.tsx`

## UI cible
Ajouter plus tard une page `Paramètres → IA & Modèles`.

Elle doit afficher :
- fournisseurs connectés ;
- clés manquantes ;
- capacités disponibles ;
- modèle par défaut par tâche ;
- modèle fallback ;
- estimation coût ;
- dernières erreurs ;
- recommandation d'optimisation.

## Contraintes
- Ne pas complexifier le MVP immédiatement.
- Ne pas stocker de clés API côté frontend.
- Ne pas exposer les secrets.
- Ne pas router une validation critique vers un modèle low-cost.
- Ne pas multiplier les providers avant d'avoir une logique de coûts claire.
- Garder Anthropic/OpenAI comme providers actifs par défaut.
- Prévoir les autres providers sans les rendre obligatoires.

## Phasage recommandé

### Phase A — Fondation sans UI
- Créer les types `AIProvider`, `AICapability`, `AITaskType`, `AIRoutingDecision`.
- Créer un router basique qui choisit entre Anthropic et OpenAI selon la tâche.
- Ajouter un fallback clair.
- Journaliser `provider`, `model`, `reason`, `estimatedCost`.

### Phase B — Connexions & Statuts
- Ajouter page `IA SELECT`.
- Afficher providers configurés/non configurés.
- Afficher capacités disponibles.

### Phase C — Optimisation coûts
- Brancher le Profit Controller au router.
- Ajouter règles par tier client/budget.
- Ajouter alertes coût.

### Phase D — Multi-provider réel
- Ajouter Gemini/Groq/Ollama pour texte.
- Ajouter Replicate/Ideogram/Firefly pour image.
- Ajouter Luma/Runway/Kling pour vidéo.

## Validation future
Quand cette spec sera implémentée :
- `npm run lint`
- `npm run build`
- `npx tsc --noEmit`
- vérifier que le pipeline actuel Studio fonctionne encore avec Anthropic/OpenAI ;
- vérifier qu'une clé manquante ne casse pas l'app ;
- vérifier que chaque décision de routing explique son choix.

## Priorité
Roadmap importante, mais à faire après :
1. Business Profile client ;
2. Vertical Playbooks ;
3. Studio orienté objectif business ;
4. Dashboard croissance ;
5. Revenue Loop minimale.
