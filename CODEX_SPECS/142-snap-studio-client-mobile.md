# Spec 142 — Snap Studio : l'expérience client mobile (restaurant / bar)

## Context

**Décision stratégique.** MAESTRO se verticalise sur restaurant/bar. Le produit phare
côté client : le restaurateur prend en photo son plat du jour ou son cocktail avec son
téléphone, l'IA **sublime la vraie photo** (il n'est pas photographe), et propose
plusieurs posts prêts à publier.

**Le différenciateur — à graver dans chaque prompt de ce module :**
Tous les concurrents utilisent l'IA pour générer de fausses photos de plats parfaits
et des captions génériques. MAESTRO fait l'inverse : **le vrai plat, servi aujourd'hui,
dans ce restaurant** — remis en valeur professionnellement (lumière, couleur, cadrage)
mais authentique et reconnaissable. Le client qui vient manger retrouve CE plat.
« L'authenticité augmentée » vs « le faux parfait ».

**Fondations existantes à réutiliser (ne rien recréer) :**
- `lib/db/queries/portal.ts` — jeton de capacité 40 car. (`getClientByPortalToken`) ;
  `/portal/*` et `/api/portal/*` sont PUBLIC_PATHS, le jeton EST l'autorisation
- `app/api/portal/[token]/posts/` — pattern de route API portail existant
- `lib/agents/vision-analyzer.ts` — analyse d'image Claude Vision
- `lib/agents/image-generator.ts` — client OpenAI images (à étendre avec `images.edit`)
- `lib/storage/local.ts` + `lib/storage/validate-upload.ts` — stockage Blob + validation magic bytes
- `lib/agents/social-expert.ts` + playbooks restaurant/bar + signaux temporels (account-director)
- Infra jobs asynchrones (`agent-jobs` + polling) — même pattern que generate-post
- `getVisualIdentity` — la DA du client guide le style de la retouche

## Décisions actées (réflexion amont avec Bradley — 2026-07)

1. **POC retouche AVANT construction** : le moteur (`lib/agents/photo-enhancer.ts`,
   gpt-image-1 `images.edit` + `input_fidelity: high`) est validé sur de vraies photos
   via le Labo interne `/labs/enhance`. Critère go/no-go : ≥ 7/10 photos fidèles ET
   améliorées. Si non-go → approche hybride (retouche classique sharp + IA au choix).
2. **Publication : validation agence en V1**, avec notification immédiate. Le réglage
   « publication directe » par client est prévu dans la structure dès le début
   (colonne/flag), activable client par client quand la confiance est établie.
   Rappel : le plat du jour est time-critical — la validation doit être rapide.
3. **Édition par le restaurateur : ajustement par instruction, pas d'édition libre.**
   Il choisit une des 3 propositions, et peut demander une modification depuis son
   téléphone (« préciser que c'est jusqu'à dimanche ») → l'IA régénère cette caption
   avec l'instruction → il valide. Même mécanisme que la régénération partielle du Studio.

## Goal

Un parcours mobile en 3 écrans pour le restaurateur, accessible par son lien portail
(sauvegardable sur l'écran d'accueil) :
**📸 Photographier → ✨ Voir avant/après + 3 propositions (ajustables par instruction) → ✅ Envoyer**
Le post choisi arrive dans la file de validation de l'agence, qui publie.

## Files to modify

### 1. `lib/agents/photo-enhancer.ts` (NOUVEAU — agent, règles MAESTRO complètes)

- **Responsabilité unique** : sublimer une photo réelle sans la dénaturer.
- Input : `{ client: Client, sourceUrl: string, sourceBuffer: Buffer, visionNotes: string }`
- Output : `{ enhancedBuffer: Buffer | null, promptUsed: string, cost: number, model: string }`
- Implémentation : `openai.images.edit` (gpt-image-1) avec la photo source + prompt de retouche.
- **Le prompt de retouche (v1, à commenter dans le code) :**
  - Améliorer : lumière (chaleureuse, appétissante), balance des couleurs, netteté,
    profondeur de champ, recadrage si nécessaire.
  - INTERDIT : remplacer/ajouter/retirer des aliments, changer l'assiette, le fond,
    la composition. Le plat doit rester EXACTEMENT le plat photographié.
  - Injecter le style DA du client si disponible (`identity.stylePrompt`) : ambiance,
    tonalité chromatique — pas les contenus.
- Si l'édition échoue ou timeout → retourner `enhancedBuffer: null` (le flux continue
  avec la photo originale — jamais bloquant).
- Coût trackée (image edit ≈ même ordre que génération).

### 2. `lib/agents/snap-pipeline.ts` (NOUVEAU — orchestrateur)

Séquence asynchrone (même pattern que `pipeline.ts`, avec `withTracking` par étape) :
1. **Vision** (`vision-analyzer`) : identifier le plat/cocktail, ingrédients visibles,
   style de dressage, et les défauts de la photo (lumière, angle, fouillis) → `visionNotes`
2. **Retouche** (`photo-enhancer`) : photo sublimée, stockée via `saveClientBuffer`
   (catégorie asset `snap_enhanced` ; l'originale reste en `snap_original`)
3. **3 propositions de posts** (réutiliser `social-expert`) avec un brief auto-construit :
   plat identifié + signaux temporels du jour (réutiliser `getTemporalSignals`
   d'account-director — l'exporter) + objectif business du client + pilier pertinent.
   **Anti-générique obligatoire dans le prompt** : interdire les formules IA clichées
   (« Régalez vos papilles », « Un délice pour les sens », « Que demander de plus ? »,
   emojis en rafale) ; exiger un détail SPÉCIFIQUE du plat identifié dans chaque caption ;
   3 angles distincts : (a) le produit/le geste, (b) l'instant/l'ambiance du jour,
   (c) l'invitation directe liée à l'objectif business (réserver ce soir, happy hour…).
4. Création d'un job agent (visible dans /agents) + retour des 3 propositions.

### 3. Migration `019-add-snaps.ts` (additive, idempotente)

Table `snaps` : id, client_id, original_asset_url, enhanced_asset_url (nullable),
vision_notes TEXT, proposals TEXT (JSON : 3 propositions), chosen_index INTEGER
(nullable), post_id (nullable — rempli à l'envoi en validation), status
CHECK('processing','ready','sent','failed'), cost REAL, created_at, updated_at.
Brancher dans `lib/db/schema.ts`. + `lib/db/queries/snaps.ts` (pattern mapRow).

### 4. Routes API (NOUVELLES — publiques via /api/portal, jeton = autorisation)

- `POST /api/portal/[token]/snap` : reçoit la photo (formData).
  - Valider le jeton (`getClientByPortalToken`) → 404 sinon.
  - Valider le fichier : `validateUploadContent` (magic bytes), images uniquement
    (jpeg/png/webp/heic→jpeg si trivial, sinon documenter la limite), max 15 Mo.
  - **Rate limit : 15 snaps / client / jour** (compter les snaps du jour en DB) →
    429 avec message clair. Protège le budget IA d'un abus de lien partagé.
  - Créer le snap (status processing), lancer `snap-pipeline` via `after()`,
    retourner `{ snapId }` en 202.
- `GET /api/portal/[token]/snap/[snapId]` : polling — statut + propositions quand prêt.
  Vérifier `snap.clientId === client.id` (pas d'IDOR entre clients).
- `POST /api/portal/[token]/snap/[snapId]/send` : `{ chosenIndex }` → crée le post
  (caption choisie + photo sublimée, status `draft`, plateformes du playbook),
  marque le snap `sent`. Le post porte un marqueur d'origine portail (réutiliser le
  mécanisme de `portalFeedback` ou le champ trigger du job) pour l'alerte dashboard.

### 5. UI mobile `app/portal/[token]/snap/page.tsx` + composants client

**Mobile-first absolu** (c'est un téléphone dans une cuisine) :
- Écran 1 : gros bouton 📸 « Photographier mon plat » —
  `<input type="file" accept="image/*" capture="environment">` — + logo/nom du resto.
- Écran 2 (pendant le traitement, ~30-60 s) : progression avec étapes en langage client
  (« Analyse de votre plat… », « Retouche de la photo… », « Rédaction des posts… ») —
  polling du snap. Message : « Vous pouvez garder cette page ouverte, ça arrive. »
- Écran 3 : **avant/après** (slider ou côte à côte — l'effet waouh commercial),
  puis les 3 propositions en cartes swipables : photo sublimée + caption + hashtags.
  Bouton par carte : « ✅ Choisir ce post ». Confirmation : « Envoyé ! Votre
  community manager valide et publie. »
- Touch targets ≥ 44px, texte ≥ 16px (pas de zoom iOS sur les inputs), pas de sidebar.
- Lien « Mes posts » vers le portail existant `/portal/[token]`.
- Ajouter la carte « Snap Studio » + QR code du lien sur la page Connexions/Portail
  côté agence (fiche client) pour l'onboarding du restaurateur.

### 6. Intégration validation agence

- Le post créé apparaît dans `/validation` (flux existant, rien à changer) avec le
  badge d'origine portail sur le dashboard (`PortalFeedbackAlert` ou équivalent).

## Don't touch

- Le Studio agence, le tunnel organique, les campagnes, le rapport mensuel.
- L'auth admin (`proxy.ts`) — le portail reste par jeton, AUCUNE session requise
  sur `/portal/*` (règle CLAUDE.md).
- Les verticales existantes (B2B incluse) — la verticalisation est un focus produit
  et marketing, pas une suppression de code.

## Validation

```bash
npx tsc --noEmit && npm run lint && npm run build
```
Manuel (sur téléphone réel, pas seulement DevTools) :
- Photo de plat réelle sombre/moche → la version sublimée reste LE MÊME plat.
- 3 captions : zéro cliché IA, un détail spécifique du plat dans chacune, 3 angles distincts.
- Jeton invalide → 404 propre. 16e snap du jour → message de limite clair.
- Échec de retouche simulé → le flux propose la photo originale, jamais d'écran cassé.
- Le post envoyé apparaît en validation avec la bonne photo.

## Output expected

~1200 lignes : 1 migration + queries, 2 agents (enhancer + pipeline), 3 routes portail,
1 page mobile + composants, 1 carte QR côté agence. 0 régression tunnel existant.

## V2 (ne PAS coder maintenant)

- Publication directe sans validation agence (réglage par client « de confiance »)
- Planification par le restaurateur (« publier à 11h30 »)
- Historique des snaps + stats simplifiées dans le portail
- Rappel push/WhatsApp « C'est l'heure du plat du jour 📸 »
- HEIC natif iOS (conversion serveur)
