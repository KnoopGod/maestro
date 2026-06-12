import type { PostStatus } from '@/types/post'

export interface PostWorkflowProgress {
  percent: number
  currentStep: string
  nextStep: string
  eta: string
  tone: 'neutral' | 'active' | 'success' | 'warning' | 'danger'
}

export function getPostWorkflowProgress(status: PostStatus, hasSupervisorReview: boolean): PostWorkflowProgress {
  if (status === 'published') {
    return { percent: 100, currentStep: 'Publié', nextStep: 'Analyse performance', eta: 'Terminé', tone: 'success' }
  }
  if (status === 'scheduled') {
    return { percent: 88, currentStep: 'Programmé', nextStep: 'Publication automatique', eta: 'Selon calendrier', tone: 'active' }
  }
  if (status === 'ready') {
    return { percent: 72, currentStep: 'Validation interne', nextStep: 'Validation client / programmation', eta: '2 min', tone: 'warning' }
  }
  if (status === 'failed') {
    return { percent: 45, currentStep: 'Erreur', nextStep: 'Correction requise', eta: 'Action manuelle', tone: 'danger' }
  }
  return hasSupervisorReview
    ? { percent: 62, currentStep: 'Optimisation', nextStep: 'Validation interne', eta: '1 min', tone: 'warning' }
    : { percent: 52, currentStep: 'Génération', nextStep: 'Optimisation', eta: '2-4 min', tone: 'neutral' }
}

export function progressBarClass(tone: PostWorkflowProgress['tone']) {
  switch (tone) {
    case 'success': return 'bg-emerald-400'
    case 'active': return 'bg-blue-400'
    case 'warning': return 'bg-amber-400'
    case 'danger': return 'bg-red-400'
    default: return 'bg-purple-400'
  }
}
