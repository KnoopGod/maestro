import type {
  BusinessObjective,
  ConversionChannel,
  ClientVertical,
  ClientStrategy,
} from '@/types/client'
import type { PostPlatform } from '@/types/post'

export interface CampaignTemplate {
  id: string
  name: string
  objective: BusinessObjective
  duration: string
  postCount: number
  platforms: PostPlatform[]
  briefTemplate: string
  kpis: string[]
}

export interface VerticalPlaybook {
  vertical: ClientVertical
  label: string
  emoji: string
  legacyType: 'restaurant' | 'hotel' | 'bar' | 'bnb' | 'restaurant_hotel'
  strategy: Pick<ClientStrategy, 'contentPillars' | 'frequency' | 'bestTimes' | 'avoid'>
  businessObjectives: BusinessObjective[]
  priorityChannels: ConversionChannel[]
  campaignTemplates: CampaignTemplate[]
  kpis: string[]
  commonMistakes: string[]
  promptContext: string
}
