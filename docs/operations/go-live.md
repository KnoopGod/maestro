# Go-live — Tester MAESTRO en direct

Objectif : passer d'un code fonctionnel à une instance en ligne utilisable et testable.
Le code est prêt ; il ne manque que la **configuration** dans Vercel.

---

## 1. Accéder à la preview (Deployment Protection)

Les déploiements de preview Vercel sont protégés par défaut. Pour y accéder :
- Ouvre l'URL de preview **dans le navigateur où tu es connecté à ton compte Vercel** — l'accès passe automatiquement.
- Sinon : Vercel Dashboard → projet `maestro` → Settings → Deployment Protection
  (désactiver, ou générer un *Protection Bypass token*).

Un `403` sans être connecté à Vercel = la protection, pas un bug de l'app.

---

## 2. Variables d'environnement Vercel

Dashboard → projet `maestro` → Settings → Environment Variables.

### Bloquantes pour tester le cœur (génération + validation)

| Variable | Où l'obtenir | Sans elle |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | Tous les agents échouent (401) |
| `OPENAI_API_KEY` | platform.openai.com | Pas d'images |
| `DATABASE_URL` | Turso (`libsql://…`) | Données perdues au redéploiement |
| `DATABASE_AUTH_TOKEN` | Turso | idem |
| `CODEXRS_PASSWORD` | au choix | App ouverte à tous |

### Bloquantes pour publier sur Meta

| Variable | Où l'obtenir | Sans elle |
|---|---|---|
| `META_APP_ID` + `META_APP_SECRET` | developers.facebook.com | Connexion Meta impossible |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob | Images cassées en prod |
| `CODEXRS_PUBLIC_URL` | domaine du déploiement (HTTPS) | Meta ne peut pas lire les images |

### Sécurité (Phase 3)

| Variable | Génération |
|---|---|
| `MAESTRO_ENCRYPTION_KEY` | `openssl rand -base64 32` — chiffre les tokens Meta en base |

> Après avoir défini `MAESTRO_ENCRYPTION_KEY`, **reconnecte les comptes Meta**
> des clients : les tokens existants en clair sont relus tels quels, mais ne
> seront chiffrés qu'à la prochaine connexion.

---

## 3. Base de données production (Turso)

1. Créer une base sur [turso.tech](https://turso.tech)
2. `DATABASE_URL = libsql://<db>-<org>.turso.io`
3. Créer un token → `DATABASE_AUTH_TOKEN`
4. Le schéma s'initialise automatiquement au premier démarrage.

---

## 4. Vérifier que tout est vert

Une fois les variables posées et le déploiement relancé, ouvre :

```
https://<ton-déploiement>/api/health
```

- `ok: true` → prêt.
- `checks.<x>.ok: false` → la variable correspondante manque (le `hint` explique laquelle).

---

## 5. Test du workflow réel

1. Se connecter (`CODEXRS_PASSWORD`).
2. Créer / ouvrir un client, renseigner son ADN de marque.
3. Studio → rédiger un brief → **Générer post complet**.
4. Suivre la progression live (la barre d'étapes des agents) — génération asynchrone.
5. Le draft apparaît → valider (Supervisor) → passer en `ready`.
6. Connecter la page Facebook + Instagram du client (Connexions).
7. Publier ou planifier.
8. Suivre l'activité en direct sur `/agents` et `/production`.

---

## Limites connues

- **Job orphelin** : si la fonction serverless est recyclée pendant le pipeline
  en arrière-plan, le job reste `running`. Un balayage périodique reste à ajouter.
- **CSRF** : protégé par cookie `SameSite=strict` + validation d'`Origin`. Un token
  CSRF dédié est prévu en V2 (multi-utilisateurs).
