import { AnalyticsNav } from '@/components/analytics/AnalyticsNav'

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <AnalyticsNav />
      {children}
    </div>
  )
}
