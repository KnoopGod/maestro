# Spec 018 — Export PDF du Bilan Client (Portail)

**Date** : 2026-06-14
**Priorité** : Haute (livraison client professionnelle)
**Dépend de** : Spec 010 (portail), page /portal/[token]

---

## Contexte

Le portail `/portal/[token]` affiche un bilan mensuel complet.
Les agences ont besoin d'envoyer ce bilan par email en PDF.
Cette spec ajoute un bouton "Télécharger en PDF" sur la page portail côté admin
et une route API pour générer le PDF.

**Approche** : CSS print media + `window.print()` côté client (pas de dépendance PDF externe).
L'iframe est stylée avec `@media print` pour produire un beau PDF depuis le navigateur.

---

## Périmètre

### Fichiers à créer
- `components/portal/PortalPrintButton.tsx` — bouton Client Component qui déclenche `window.print()`
- `app/portal/[token]/print.css` — styles d'impression dédiés (masquer nav, ajuster couleurs)

### Fichiers à modifier
- `app/portal/[token]/page.tsx` — ajouter le bouton print en haut de page

---

## Implémentation

### PortalPrintButton

```typescript
'use client'
export function PortalPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="..."
    >
      Télécharger PDF
    </button>
  )
}
```

### CSS Print

Injecter via `<style media="print">` dans le layout ou directement dans la page :
- Masquer le bouton d'impression lui-même
- Forcer fond blanc, texte noir
- Supprimer la navigation

---

## Validation

Test : ouvrir `/portal/[token]` → clic "Télécharger PDF" → dialog d'impression → sauvegarder en PDF.
