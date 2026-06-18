import type { ClientType, BusinessObjective, ConversionChannel } from '@/types/client'
export type { BusinessObjective, ConversionChannel }
export { BUSINESS_OBJECTIVE_LABELS } from '@/types/client'

export interface CampaignTemplate {
  id: string
  name: string
  objective: BusinessObjective
  duration: string
  postCount: number
  description: string
  briefTemplate: string
}

export interface VerticalPlaybook {
  vertical: string
  label: string
  emoji: string
  dbType: ClientType
  color: string
  businessObjectives: BusinessObjective[]
  contentPillars: string[]
  peakDays: string[]
  offDays: string[]
  bestPostingTimes: string[]
  conversionChannels: ConversionChannel[]
  campaignTemplates: CampaignTemplate[]
  primaryKpis: string[]
  promptContext: string
  commonMistakes: string[]
  peakSeasons: string[]
  offSeasons: string[]
}
