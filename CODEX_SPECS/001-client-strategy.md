# 001 — Add typed marketing strategy to clients

## Context

- Project: **Maestro** (Next.js 16.2.6 + LibSQL + TypeScript)
- Working directory: `/Users/bradleydave/Dev/ai-command-center`
- The codebase manages HORECA clients (restaurants, hotels, bars, B&Bs). Each `Client` row currently has basic brand-voice fields (`tone`, `keywords`, `avoid`) but no formal marketing strategy.
- We are adopting a strategy structure inspired by a parallel codebase, adapted to our schema and conventions.

**Read these files before editing anything**:
- `lib/db/schema.ts`        — the LibSQL schema bootstrap
- `lib/db/queries/clients.ts` — `mapRow` / `createClient` / `updateClient` shape
- `lib/db/seed.ts`            — initial seed (do NOT re-seed, only update mapping)
- `types/client.ts`           — the `Client` / `ClientType` types and `CLIENT_TYPES` config

## Goal

Add a **`ClientStrategy`** object on every `Client`, persisted in DB and exposed via the types. The strategy is auto-generated from the client `type` at creation time via a new `createClientStrategy()` helper.

## Files to modify

1. **`types/client.ts`**
   - Add interface `ClientStrategy`:
     ```ts
     export interface ClientStrategy {
       objective: string
       contentPillars: string[]
       platforms: ('instagram' | 'facebook' | 'tiktok' | 'linkedin')[]
       frequency: string
       bestTimes: string[]   // ['11:30', '18:30', …]
       avoid: string[]
     }
     ```
   - Add `strategy: ClientStrategy` to the existing `Client` interface (NEW required field).

2. **`lib/db/schema.ts`**
   - In the `clients` table CREATE TABLE statement, add a column `strategy TEXT` after `languages TEXT DEFAULT '["fr"]'`.
   - Do **not** alter other tables.

3. **`lib/db/queries/clients.ts`**
   - In the `ClientRow` row interface, add `strategy: string | null`.
   - In `mapRow`, parse `JSON.parse(row.strategy ?? 'null')`. If null, **call** `createClientStrategy({type: row.type, name: row.name, city: row.city ?? '', positioning: row.description ?? '', tone: row.brand_voice_tone ?? '', offerFocus: ''})` to backfill on read (so existing rows get a default without a migration script).
   - In `createClient`, before the INSERT, compute `const strategy = input.strategy ?? createClientStrategy({...})` and `JSON.stringify(strategy)` into the new column. Add `strategy` to the SQL columns + values.
   - In `updateClient`, support `patch.strategy` by JSON-stringifying it via the existing mapping table pattern.

4. **`lib/agents/strategy-director.ts`** (NEW FILE)
   - Export `createClientStrategy(input: { type: ClientType, name: string, city: string, positioning: string, tone: string, offerFocus: string }): ClientStrategy`.
   - Per type, return sensible defaults:
     - `restaurant`        → pillars `['Plat signature', 'Menu du jour', 'Coulisses', 'Avis client', 'Réservation week-end']`, frequency `'4 posts/semaine'`, bestTimes `['11:30', '18:30', '19:15']`, avoid `['ton luxe froid', 'visuels stock photo']`.
     - `bar`               → pillars `['Cocktail signature', 'Ambiance soirée', 'Happy hour', 'Événement', 'Clientèle locale']`, frequency `'5 posts/semaine'`, bestTimes `['17:30', '20:00', '21:30']`, avoid `['ton institutionnel', 'visuels trop sages']`.
     - `hotel`             → pillars `['Chambres', 'Expérience locale', 'Petit-déjeuner', 'Saisonnalité', 'Avis client']`, frequency `'4 posts/semaine'`, bestTimes `['08:30', '12:15', '18:00']`, avoid `['vocabulaire hôtel de chaîne', 'photos impersonnelles']`.
     - `bnb`               → same pillars/times as `hotel` but frequency `'3 posts/semaine'`.
     - `restaurant_hotel`  → merge restaurant pillars + hotel pillars (deduplicated), frequency `'4 posts/semaine'`.
   - All variants: `platforms: ['instagram', 'facebook']`. `objective` is a French sentence that interpolates the client name and city. Inject the `offerFocus` (if non-empty) and `positioning` (if non-empty) into the objective.
   - Add a `sharedAvoid` array `['contenu générique', 'promesses exagérées', 'ton robotique']` prepended to every type's `avoid`.

5. **`lib/db/seed.ts`**
   - For each seed client, add a hand-written `strategy` field (don't rely on the helper) — this lets the seed be the source of "good" examples. Use the same shapes as #4 but tailored per real client (e.g., Le Bistrot de Marie should mention `pâte fermentée 72h`).

6. **`app/clients/new/page.tsx`** and **`lib/actions/clients.ts`**
   - `createClientAction` should pass nothing strategy-related to `dbCreateClient` — the helper will fill it. No UI changes for now.

7. **`app/clients/[id]/page.tsx`**
   - In the right column (where "Brand Voice" is currently shown), add a new card titled **"Stratégie marketing"** displaying:
     - `client.strategy.objective` (paragraph)
     - `contentPillars` as colored chips (same style as keywords)
     - `frequency` + `bestTimes` joined as `"4 posts/semaine · 11:30, 18:30, 19:15"`
     - `avoid` as red-tinted chips
   - Keep the Brand Voice card as-is. Add the strategy card just below it.

## Don't touch

- The `posts` table or the publish pipeline.
- The Meta integration files.
- The Studio page.
- Any agent files other than the new `strategy-director.ts`.
- The visual-identity / asset library.
- The Sidebar, TopBar, layout.

## Conventions to respect

- DB columns are `snake_case`, TS fields are `camelCase`. Map both ways in `mapRow` / `createClient`.
- All Anthropic-style strings (UI labels, error messages, objectives) in **French**.
- Variable / function / file names in **English**.
- Use `'use client'` only when interactivity is required. The new strategy card on the client detail page is a Server Component — no `'use client'`.
- Tailwind classes follow the existing dark theme (`bg-gray-900/40`, `border-gray-800`, `text-gray-200`, etc.). Strategy chips use `purple-900/40 / text-purple-300 / border-purple-700/30`. Avoid chips use `red-900/30 / text-red-300 / border-red-700/30`.

## Validation steps Codex must run

1. `npx tsc --noEmit` — must pass with zero errors.
2. `npm run build` — must complete successfully and show all routes.
3. Re-seed the DB to apply the schema column: `npx tsx -e "import('./lib/db/schema').then(m => m.initSchema())"` (this only adds the column for new tables; if `clients` already exists, run `ALTER TABLE clients ADD COLUMN strategy TEXT;` via a one-line script).
4. **Backfill** existing client rows: write a small `lib/db/migrations/001-add-strategy.ts` script that loops over all clients, computes the default strategy via `createClientStrategy`, and updates the row. Document running it in the spec output.

## Output expected

When done, write a short summary to stdout:
- Files created
- Files modified
- Number of clients backfilled
- Any TypeScript errors or build warnings
- The exact `ALTER TABLE` / backfill commands run
