# Spec 037 — iCal Export for Scheduled Posts

## Contexte

Les agences gèrent leurs calendriers clients dans Google Calendar, Apple Calendar ou Outlook.
Exporter les posts planifiés en format iCal (.ics) permet de synchroniser le calendrier MAESTRO
avec l'agenda de l'agence et de le partager avec les clients.

## User Story

> En tant qu'agent HORECA, je veux exporter les posts planifiés en fichier iCal pour les importer
> dans mon calendrier ou l'envoyer au client pour validation.

## Comportement

- `GET /api/posts/export/ical?clientId=X` — retourne un fichier .ics
- `clientId` optionnel : sans paramètre, exporte tous les posts planifiés
- Chaque post planifié = un VEVENT d'une durée de 30 minutes
- SUMMARY : `{ClientName} — {PLATFORMS} ({pilier si défini})`
- DESCRIPTION : brief + caption + hashtags
- Bouton "iCal" dans l'en-tête de la page /calendar
- Conforme RFC 5545 : line folding à 75 caractères, encodage des caractères spéciaux

## Architecture

- `app/api/posts/export/ical/route.ts` — GET handler, génère iCal RFC 5545
- `app/calendar/page.tsx` — bouton "iCal" avec lien vers l'API

## Fichiers

- `CODEX_SPECS/037-ical-export.md`
- `app/api/posts/export/ical/route.ts` (nouveau)
- `app/calendar/page.tsx` (modifié — bouton iCal)
