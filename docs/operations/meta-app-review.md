# Meta App Review — publier sur les pages de clients en production

## Pourquoi c'est indispensable

Aujourd'hui l'app Meta fonctionne en **mode Développement** : elle ne peut publier que sur
des pages dont les administrateurs ont un rôle dans l'app (ou liées au même Business Manager).
C'est suffisant pour 2-3 clients pilotes. **Ça ne scale pas** : chaque nouveau client
demanderait une manipulation manuelle fragile.

Pour publier sur la page de n'importe quel client signé, l'app doit passer l'**App Review**
de Meta et obtenir l'« Advanced Access » sur les permissions ci-dessous.
Délai réaliste : **2 à 6 semaines** (allers-retours inclus). → À lancer dès le premier
client pilote signé, en parallèle de l'exploitation.

## Permissions à demander (Advanced Access)

| Permission | Usage MAESTRO |
|---|---|
| `pages_show_list` | Lister les pages du client dans le wizard de connexion |
| `pages_read_engagement` | Lire les insights des posts (sync-insights) |
| `pages_manage_posts` | Publier sur la page Facebook |
| `instagram_basic` | Identifier le compte Instagram Business lié |
| `instagram_content_publish` | Publier sur Instagram |
| `business_management` | Pages gérées via Business Manager (fréquent chez les pros) |

## Pré-requis déjà en place dans MAESTRO ✅

- Politique de confidentialité : `/privacy` (public, dans PUBLIC_PATHS)
- Instructions de suppression de données : `/data-deletion` (public)
- URL de production HTTPS : `https://maestro-green.vercel.app`

À renseigner dans developers.facebook.com → App Settings → Basic :
Privacy Policy URL, Data Deletion Instructions URL, App Domain, catégorie (Business).

## Le dossier de soumission (ce que Meta attend)

1. **Un compte de test** : créer une page Facebook + compte Instagram Business de démo,
   liés à un utilisateur de test — Meta rejouera votre parcours avec.
2. **Une capture vidéo (screencast) par permission** montrant le parcours réel :
   - Connexion à MAESTRO → fiche client → « Connexions »
   - Collage du token / sélection de la page (`pages_show_list`)
   - Génération d'un post dans le Studio → validation → **publication effective**
     visible sur la page (`pages_manage_posts`, `instagram_content_publish`)
   - Page analytics montrant les stats du post (`pages_read_engagement`)
3. **Notes d'utilisation** en anglais, une par permission, format :
   « MAESTRO is a social media management tool for agencies. The user connects his
   client's Facebook Page, then MAESTRO publishes approved posts on the Page on the
   client's behalf. » — décrire le *bénéfice utilisateur*, pas la technique.

## Causes de rejet fréquentes (à éviter)

- La vidéo ne montre pas la permission **réellement utilisée** de bout en bout.
- Parcours de test impossible à rejouer (app protégée sans identifiants fournis —
  ⚠ fournir le mot de passe MAESTRO de démo dans les instructions de test,
  et désactiver la Deployment Protection Vercel avant la soumission).
- Privacy policy générique qui ne mentionne pas les données Meta.
- Demander plus de permissions que ce que la vidéo démontre.

## Checklist de soumission

- [ ] App Settings → Basic complété (privacy, data deletion, domaine, icône 1024px)
- [ ] Business Verification faite (KBIS / documents société — requis pour Advanced Access)
- [ ] Page + compte IG de démo créés et connectés dans MAESTRO
- [ ] Screencasts enregistrés (un parcours complet suffit souvent pour plusieurs permissions)
- [ ] Instructions de test rédigées avec identifiants de démo
- [ ] Deployment Protection Vercel désactivée sur la production
- [ ] Soumission → surveiller les retours (ils arrivent par vagues, répondre vite)

## En attendant l'approbation (mode pilote)

Pour chaque client pilote :
1. `developers.facebook.com/apps/<APP_ID>/roles/` → ajouter l'admin de la page client
   comme **testeur** de l'app (il doit accepter l'invitation), **ou**
2. Lier la page du client au Business Manager de l'agence (recommandé : c'est aussi
   le modèle cible en production).

Le reste du parcours MAESTRO (token → discover → connect → publish) est identique.
