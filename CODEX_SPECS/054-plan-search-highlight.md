# Spec 054 — Plan Search Text Highlight

## Objectif
Surligner les occurrences du terme recherché dans les captions et briefs des PostRow
de la page plan, pour localiser visuellement ce qui correspond.

## Comportement

### Composant `HighlightText`
- Props : `text: string`, `query: string | undefined`
- Split sur la query (case-insensitive), retourne des spans
- Termes trouvés : `<mark>` jaune/amber
- Pas de XSS : pas de dangerouslySetInnerHTML, découpage pur string

### Zones surlignées
- Caption (ligne `p.caption`)
- Brief (affiché dans les métadonnées)

## Fichiers créés / modifiés
- `components/plan/HighlightText.tsx` (créé)
- `app/plan/page.tsx` — utilise HighlightText dans PostRow
