# Spec 038 — Cron Execution Log

## Objectif
Tracer chaque exécution des jobs cron (publish-due, cleanup-jobs) en base pour
détecter les dérives, timeouts et erreurs de scheduling sans fouiller les logs
Vercel.

## Comportement

### Table `cron_executions`
Créée par la migration 015. Colonnes :
- `id` TEXT PK (nanoid)
- `job_type` TEXT (`publish-due` | `cleanup-jobs`)
- `status` TEXT (`running` | `completed` | `failed`)
- `started_at` INTEGER (ms epoch)
- `finished_at` INTEGER nullable
- `processed_count` INTEGER
- `results` TEXT (JSON)

### Lifecycle
1. `startCronExecution(jobType)` insère une ligne avec `status='running'`.
2. Le job s'exécute normalement.
3. `completeCronExecution(id, { status, processedCount, results })` clôt la ligne.

Les appels sont fire-and-forget (`.catch(() => null)`) : un échec de log n'arrête pas le job.

### Affichage — `/agents` page
Section "Cron / Scheduler" après la section "Activité en direct" :
- Tableau des 12 dernières exécutions
- Colonnes : Job, Statut (badge coloré), Traités, Durée, Quand
- Indicateur coloré (point) selon statut

## Fichiers créés / modifiés
- `lib/db/migrations/015-add-cron-log.ts` (créé)
- `lib/db/schema.ts` (migration 015 ajoutée)
- `lib/db/queries/cron-log.ts` (créé)
- `app/api/cron/publish-due/route.ts` (logging ajouté)
- `app/api/cron/cleanup-jobs/route.ts` (logging ajouté)
- `app/agents/page.tsx` (section cron ajoutée)
