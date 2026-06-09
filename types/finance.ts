export interface ClientFinanceSettings {
  clientId: string
  monthlyRetainer: number
  targetMarginPct: number
  monthlyApiBudget: number
  monthlyMetaAdsBudget: number
  monthlyGoogleAdsBudget: number
  plannedPostsPerMonth: number
  plannedImagesPerMonth: number
  plannedVideosPerMonth: number
  hourlyInternalRate: number
  monthlyInternalHours: number
  createdAt: number
  updatedAt: number
}

export interface ProfitReport {
  clientId: string
  clientName: string
  status: 'profitable' | 'watch' | 'loss' | 'missing_budget'
  monthLabel: string
  revenue: number
  targetMarginPct: number
  currentMonth: {
    postsGenerated: number
    imagesAnalyzed: number
    daSyntheses: number
    apiCost: number
    tokensUsed: number
  }
  forecast: {
    projectedApiCost: number
    adSpend: number
    internalCost: number
    totalCost: number
    profit: number
    marginPct: number
    costPerPlannedPost: number
  }
  budgetUse: {
    apiPct: number
    totalCostPct: number
  }
  recommendations: string[]
  assumptions: string[]
  settings: ClientFinanceSettings
}
