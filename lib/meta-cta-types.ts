export const META_CTA_TYPES = [
  { value: 'BOOK_TRAVEL', label: 'Réserver', emoji: '📅' },
  { value: 'LEARN_MORE', label: 'En savoir plus', emoji: '👉' },
  { value: 'CONTACT_US', label: 'Nous contacter', emoji: '📞' },
  { value: 'SHOP_NOW', label: 'Commander', emoji: '🛒' },
  { value: 'GET_OFFER', label: "Voir l'offre", emoji: '🎁' },
  { value: 'SIGN_UP', label: "S'inscrire", emoji: '✍️' },
  { value: 'CALL_NOW', label: 'Appeler maintenant', emoji: '📱' },
] as const

export type MetaCtaType = typeof META_CTA_TYPES[number]['value']

export function getMetaCtaLabel(value?: string | null): string {
  return META_CTA_TYPES.find(cta => cta.value === value)?.label ?? 'En savoir plus'
}
