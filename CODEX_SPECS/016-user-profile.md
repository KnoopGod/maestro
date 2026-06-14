# Spec 016 — Profil Utilisateur V2

**Date** : 2026-06-14
**Priorité** : Normale
**Dépend de** : Spec 014 (auth V2 active), Spec 011 (table users)

---

## Contexte

Les utilisateurs V2 peuvent se connecter avec email + mot de passe.
Cette spec leur permet de modifier leur propre nom et mot de passe depuis `/settings/profile`.
L'administrateur (owner) peut déjà gérer les comptes depuis `/settings/team`.

---

## Périmètre

### Fichiers à créer
- `app/api/auth/profile/route.ts` — PATCH : met à jour name et/ou password de l'utilisateur connecté
- `app/settings/profile/page.tsx` — page profil
- `components/settings/ProfileForm.tsx` — formulaire nom + changement de mot de passe

### Fichiers à modifier
- `app/settings/page.tsx` — ajouter lien vers /settings/profile si MULTI_USER_MODE actif

---

## API

### `PATCH /api/auth/profile`

Requiert une session V2 valide.

```json
{ "name": "Nouveau nom", "currentPassword": "...", "newPassword": "..." }
```

- `name` seul : met à jour le nom uniquement
- `currentPassword` + `newPassword` : vérifie l'ancien mdp, hash le nouveau
- `newPassword` minimum 8 caractères
- Retourne `{ ok: true, user: { id, name, role } }`

---

## Règles de sécurité

- Toujours exiger `currentPassword` pour changer le mot de passe.
- Ne jamais retourner le hash dans la réponse.
- `newPassword` minimum 8 chars, pas de limite max côté serveur (bcrypt/scrypt gère).
