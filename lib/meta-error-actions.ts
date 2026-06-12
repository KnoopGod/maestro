export interface MetaErrorAction {
  label: string
  href: string
  reason: string
  tone: 'danger' | 'warning' | 'info'
}

export function getMetaErrorAction(error?: string | null, clientId?: string | null): MetaErrorAction | null {
  if (!error) return null

  const normalized = error.toLowerCase()
  const clientBase = clientId ? `/clients/${clientId}` : ''

  if (
    normalized.includes('#190') ||
    normalized.includes('token') ||
    normalized.includes('expir') ||
    normalized.includes('invalide')
  ) {
    return {
      label: 'Reconnecter Meta →',
      href: clientId ? `${clientBase}/connections` : '/social/settings/connections',
      reason: 'Le token Meta semble expiré ou invalide. Reconnecte Facebook/Instagram pour réactiver la publication.',
      tone: 'danger',
    }
  }

  if (
    normalized.includes('#200') ||
    normalized.includes('pages_manage_posts') ||
    normalized.includes('permission') ||
    normalized.includes('admin')
  ) {
    return {
      label: 'Vérifier permissions Meta →',
      href: clientId ? `${clientBase}/connections` : '/social/settings/connections',
      reason: 'Meta refuse la publication faute de permissions suffisantes ou de rôle admin sur la page.',
      tone: 'warning',
    }
  }

  if (
    normalized.includes('#100') ||
    normalized.includes('invalid parameter') ||
    normalized.includes('image') ||
    normalized.includes('codexrs_public_url') ||
    normalized.includes('public_url') ||
    normalized.includes('localhost') ||
    normalized.includes('accessible')
  ) {
    return {
      label: 'Ouvrir la Library →',
      href: clientId ? `${clientBase}/library` : '/library',
      reason: 'Meta doit accéder à une image ou vidéo publique. Vérifie que le média est bien uploadé dans la Library.',
      tone: 'warning',
    }
  }

  return {
    label: 'Ouvrir les connexions →',
    href: clientId ? `${clientBase}/connections` : '/social/settings/connections',
    reason: 'Vérifie la configuration Meta du client avant de relancer la publication.',
    tone: 'info',
  }
}
