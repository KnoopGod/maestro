# Fonctionnalité : Gestion des clients

## Rôle

Le portail client permet de gérer le profil, l'ADN de marque, les connexions sociales, la médiathèque et le suivi de chaque client HORECA.

## Pages

```
/clients                    — liste de tous les clients
/clients/new                — créer un client
/clients/[id]               — profil client
/clients/[id]/edit          — modifier le profil
/clients/[id]/setup         — configuration initiale (DA, brief)
/clients/[id]/connections   — connexions Meta OAuth
/clients/[id]/library       — médiathèque (voir features/media-library.md)
/clients/[id]/agents        — historique des jobs IA
/clients/[id]/analytics     — performance des posts Meta
/clients/[id]/finance       — suivi financier
/clients/[id]/launch        — tunnel de lancement
/clients/[id]/report        — rapport exportable
```

## Données d'un client

Définies dans `lib/db/queries/clients.ts` :

```typescript
interface Client {
  id: string
  name: string
  type: string           // restaurant, hotel, bar, etc.
  description: string
  targetAudience: string
  brandVoice: string     // ton et style de communication
  colorPalette: string   // hex codes séparés par virgules
  logoUrl: string | null
  websiteUrl: string | null
  instagramHandle: string | null
  createdAt: string
}
```

## Direction Artistique (DA)

La DA est une synthèse générée par le `visual-identity` agent à partir des médias uploadés du client.
Elle guide la génération d'images pour que chaque post soit cohérent avec l'identité visuelle.

Stockée dans `client_visual_identity` : `{ style, colors, mood, composition, lighting, reference_image_url }`.

Générée via :
```
POST /api/clients/[id]/analyze-da
→ visual-identity agent analyse les assets
→ sauvegarde dans client_visual_identity
```

**Optimisation** : si la DA existe déjà, elle n'est pas régénérée automatiquement.
Pour la mettre à jour : cliquer "Recalculer DA" dans la bibliothèque (`AnalyzeDAButton`).

## Composants

| Composant | Rôle |
|-----------|------|
| `ClientCard` | Carte résumée dans la liste |
| `ClientFilters` | Filtres par type de client |
| `DeleteClientButton` | Suppression avec confirmation |
| `MetaConnectionWizard` | Wizard de connexion OAuth |
| `MetaPreflightChecklist` | Vérifie les pré-requis avant connexion |
| `StrategyPanel` | Affiche la stratégie générée |
| `LaunchTunnel` | Suivi des étapes de lancement |

## Server Actions

`lib/actions/clients.ts` :
- `createClient(formData)` — crée le client, redirige vers `/clients/[id]/setup`
- `updateClient(id, formData)` — met à jour les données, `revalidatePath()`
- `deleteClient(id)` — supprime client + toutes ses données, redirige vers `/clients`

## Tunnel de lancement

`/clients/[id]/launch` — processus guidé en étapes pour préparer un nouveau client :
1. Profil complété
2. Médias uploadés (≥ 3)
3. DA analysée
4. Compte Meta connecté
5. Premier post généré

Données dans `lib/db/queries/launch-tunnel.ts`.

## Rapport client

`/clients/[id]/report` — export PDF du bilan mensuel.
`PrintButton` composant Client pour déclencher `window.print()`.
