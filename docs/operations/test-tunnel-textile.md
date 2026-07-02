# Test A→Z du tunnel — client pilote « Société textile B2B »

Objectif : dérouler le parcours complet client → publication sur un cas réel (ta société),
noter chaque friction, et valider que MAESTRO est prêt pour un client payant.

URL : https://maestro-green.vercel.app · Durée estimée : 45-60 min

> La publication automatique couvre Facebook, Instagram et LinkedIn lorsque chaque
> compte est connecté. Sans connexion LinkedIn, la caption reste disponible pour
> une publication manuelle.

---

## Étape 1 — Création du client (5 min)

`/clients/new`

- [ ] La grille « Type d'activité » propose bien **💼 Société B2B**
- [ ] Remplir : nom, ville, description courte (positionnement en 1 phrase)
- [ ] **Résumé compris par l'outil** — le champ le plus important. Modèle :
  « Fabricant/fournisseur textile B2B basé à X. Clients cibles : marques, hôtels,
  restaurants, revendeurs. Offres : {tissus techniques / confection / marquage…}.
  Objectif : générer des demandes de devis et des RDV commerciaux via LinkedIn,
  Instagram et Facebook. Ton : expert, direct, humain. »
- [ ] Profil business : objectif prioritaire = **Générer des leads B2B**,
  offres principales, panier moyen (valeur d'une commande type), canaux de
  conversion (Message LinkedIn, Email, Téléphone, Site web)

**Vérifier après création :** la fiche client affiche « Société B2B » (pas « Bar » ni « Restaurant »).

## Étape 2 — Identité visuelle (10 min)

Fiche client → **Library**

- [ ] Uploader 8-12 vraies photos : produits, atelier/production, équipe, réalisations chez des clients
- [ ] Si tu as un logo et une charte (PDF) : les uploader aussi (catégorie appropriée)
- [ ] Lancer l'analyse → attendre la synthèse de l'identité visuelle
- [ ] **Lire le résultat** : la description de style correspond-elle à ton univers ?
  (couleurs, matières, ambiance atelier vs studio) → noter si c'est à côté

## Étape 3 — Génération du premier post (10 min)

`/studio` → sélectionner le client

- [ ] Vérifier que le panneau client affiche l'objectif business
- [ ] Vérifier que le panneau « Mission business » affiche **Générer des leads B2B**
- [ ] Plateformes : Instagram + Facebook (+ LinkedIn pour tester la caption)
- [ ] Brief test réaliste, ex. : « Mettre en avant notre nouvelle gamme de tissus
  recyclés pour les marques éco-responsables. Mentionner échantillons gratuits
  sur demande. »
- [ ] Générer → suivre la progression (~30-60 s)

**Juger le résultat comme un client le ferait :**
- [ ] La caption parle-t-elle à un acheteur professionnel (pas à un consommateur) ?
- [ ] Y a-t-il un CTA commercial concret (devis, échantillon, RDV) ?
- [ ] Le visuel généré est-il crédible pour du B2B textile ? Cohérent avec tes photos ?
- [ ] Tester « Régénérer le texte » avec une instruction (ex. « plus court, sans emoji »)
- [ ] Tester le mode « visuel depuis la Library » (vraie photo produit au lieu du généré)

## Étape 4 — Validation (5 min)

`/validation`

- [ ] Le post apparaît avec le verdict du Supervisor
- [ ] Lire l'analyse : pertinente ou générique ?
- [ ] Passer le post en « ready »

## Étape 5 — Connexion Meta (10 min) — le passage sensible

Fiche client → **Connexions**

- [ ] Générer un User Access Token via Graph API Explorer (avec les permissions pages)
- [ ] Coller → la page Facebook de ta société apparaît dans la liste
- [ ] Sélectionner la page → connexion enregistrée (Instagram Business détecté si lié)
- [ ] Cliquer **« Diagnostiquer le token »** → vérifier que `pages_manage_posts` est présent
- ⚠ Si publication refusée ensuite : voir la section debugging du CLAUDE.md
  (rôle Admin requis, use case « Tout gérer sur votre Page » dans l'app Meta)

## Étape 6 — Publication (5 min)

- [ ] Publier le post (directement ou planifié à +15 min pour tester le cron)
- [ ] Vérifier sur Facebook ET Instagram : image présente, caption complète, pas de texte tronqué
- [ ] Si LinkedIn est connecté : vérifier la publication automatique. Sinon, copier la caption et la publier manuellement.
- [ ] Dans `/plan` : le post est bien marqué « publié » avec les IDs Meta

## Étape 7 — Boucle de suivi (à J+2)

- [ ] `/analytics` et la fiche client : les stats réelles (reach, interactions) remontent
  (sync automatique quotidienne)
- [ ] Noter les premières retombées business réelles : vues LinkedIn, DM, demandes

---

## Grille de notation (à remplir pendant le test)

| Étape | Ça marche ? | Friction / bug | Qualité (1-5) |
|---|---|---|---|
| Création client | | | |
| Identité visuelle | | | |
| Génération post | | | |
| Validation | | | |
| Connexion Meta | | | |
| Publication | | | |

**Question finale, la seule qui compte :** si ce post avait été produit pour un client
payant à 200 €/mois, l'aurais-tu envoyé tel quel ? Si non, qu'est-ce qui manque —
le fond (stratégie), la forme (texte), ou le visuel ?
