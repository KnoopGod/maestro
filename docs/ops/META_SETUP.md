# Meta Setup

Guide opérationnel pour connecter Facebook et Instagram client par client dans CODEXRS.

Ne colle jamais de vrai token dans cette doc, dans les logs ou dans un ticket.

## Variables globales

À configurer une seule fois dans `.env.local` et en production :

```env
META_APP_ID=
META_APP_SECRET=
```

Ces valeurs identifient l'app Meta CODEXRS. Elles ne remplacent pas les tokens de Pages des clients.

## Données par client

La page `/clients/[id]/connections` enregistre les valeurs nécessaires dans les comptes sociaux du client :

- Facebook Page ID ;
- nom/handle de la Page ;
- Page Access Token retourné par Meta ;
- Instagram Business Account ID si un compte Instagram est lié ;
- handle Instagram.

Le User Access Token collé dans le wizard sert à découvrir les Pages. Le token stocké ensuite est le Page Access Token de la Page choisie.

## Permissions requises

Scopes à cocher dans Graph API Explorer :

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`

Scopes parfois demandés selon l'app ou le compte Business :

- `pages_manage_metadata`
- `business_management`

## Setup client

1. Passer l'Instagram du client en compte professionnel Business ou Créateur.
2. Lier cet Instagram à la Page Facebook exacte du client.
3. Vérifier dans Meta Developer Console que l'app globale a les cas d'usage Pages + Instagram.
4. Dans Graph API Explorer, générer un User Access Token avec les scopes requis.
5. Dans CODEXRS, ouvrir `/clients/[id]/connections`, coller le User Token, lancer `Pré-diagnostiquer`, puis `Découvrir mes pages`.
6. Choisir la Page du client. Le navigateur envoie seulement la Page ID + le User Token ; le serveur redécouvre la Page et stocke le Page Access Token côté serveur.
7. Connecter Instagram si détecté.
8. Lancer `Diagnostiquer le token`.
9. Publier un `Test post réel` Facebook, vérifier la Page, puis supprimer le test si besoin.

## Images et Instagram

Instagram exige une image accessible depuis Internet. En production, utilise une URL publique HTTPS, par exemple Vercel Blob.

Les URLs `localhost`, les fichiers locaux et les images derrière authentification ne sont pas publiables par Instagram.

## Découverte Page + Instagram

Le wizard appelle Meta avec le User Access Token :

- `/me/accounts` liste les Pages accessibles ;
- `instagram_business_account` révèle l'Instagram lié à chaque Page ;
- la découverte envoyée au navigateur ne contient pas les Page Access Tokens ;
- au moment de connecter, le serveur redécouvre la Page choisie et stocke le Page Access Token pour ce client.

Si Instagram n'apparaît pas, les causes probables sont :

- compte Instagram encore personnel ;
- Instagram lié à une autre Page Facebook ;
- Page sélectionnée incorrecte ;
- scope `instagram_basic` absent ;
- l'utilisateur Meta n'a pas le bon accès à la Page.

## Diagnostic token

Le bouton `Pré-diagnostiquer` vérifie le User Token avant découverte.

Le bouton `Diagnostiquer le token` vérifie le Page Access Token stocké pour le client :

- validité ;
- app Meta ;
- type de token ;
- expiration ;
- Page associée ;
- scopes présents ou manquants.

Si des scopes manquent, regénère le User Access Token dans Graph API Explorer avec les scopes listés, reconnecte le client, puis relance le diagnostic.

Différence importante :

- avant connexion, `pages_show_list` est requis pour découvrir les Pages ;
- après connexion, le Page Token doit surtout permettre publication/lecture : `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`.

## Erreurs courantes

`#190` token expiré ou invalide :

- regénérer le User Access Token ;
- reconnecter le client pour stocker un nouveau Page Access Token ;
- vérifier `META_APP_ID` et `META_APP_SECRET` si l'échange longue durée échoue.

`#200` permissions ou rôle insuffisant :

- vérifier que l'utilisateur Meta a accès admin à la Page ;
- ajouter les scopes manquants ;
- accepter les permissions pour la Page du client dans le consentement Meta.

`#100` paramètre invalide ou image inaccessible :

- vérifier que l'ID Page ou Instagram est correct ;
- utiliser une image publique HTTPS ;
- éviter `localhost`, fichiers locaux et URLs qui redirigent vers une page privée.

Instagram non lié :

- passer Instagram en compte professionnel ;
- lier Instagram à la Page Facebook du client ;
- relancer la découverte ou `Ajouter Instagram` après correction.
