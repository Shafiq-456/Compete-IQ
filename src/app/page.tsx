'use client'

import * as React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { Providers } from '@/components/providers'
import { AuthProvider, useAuth } from '@/components/auth/auth-provider'
import { AuthScreen } from '@/components/auth/auth-screen'
import { LandingPage } from '@/components/landing/landing-page'
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen'
import { FirstScanScreen } from '@/components/onboarding/first-scan-screen'
import { type NavKey, NAV_GROUPS } from '@/lib/nav'
import { useQuery } from '@tanstack/react-query'
import { DashboardView } from '@/components/views/dashboard-view'
import { CompetitorsView } from '@/components/views/competitors-view'
import { WebsiteView } from '@/components/views/website-view'
import { NewsView } from '@/components/views/news-view'
import { ProductsView } from '@/components/views/products-view'
import { PricingView } from '@/components/views/pricing-view'
import { CareersView } from '@/components/views/careers-view'
import { SocialView } from '@/components/views/social-view'
import { ReviewsView } from '@/components/views/reviews-view'
import { SwotView } from '@/components/views/swot-view'
import { ReportsView } from '@/components/views/reports-view'
import { ChatView } from '@/components/views/chat-view'
import { AnalyticsView } from '@/components/views/analytics-view'
import { AlertsView } from '@/components/views/alerts-view'
import { AgentsView } from '@/components/views/agents-view'
import { DigestView } from '@/components/views/digest-view'
import { Loader2 } from 'lucide-react'

const TITLE_MAP: Record<NavKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Real-time competitor intelligence overview' },
  competitors: { title: 'Competitors', subtitle: 'Manage tracked competitors and monitoring' },
  website: { title: 'Website Monitoring', subtitle: 'Detect page, UI, and content changes' },
  news: { title: 'News Intelligence', subtitle: 'Funding, M&A, partnerships, leadership' },
  products: { title: 'Product Intelligence', subtitle: 'Feature launches and product updates' },
  pricing: { title: 'Pricing Intelligence', subtitle: 'Track price changes and discounts' },
  careers: { title: 'Career Intelligence', subtitle: 'Hiring signals and team expansion' },
  social: { title: 'Social Media Intelligence', subtitle: 'Posts, engagement, and campaigns' },
  reviews: { title: 'Customer Review Intelligence', subtitle: 'Sentiment and customer voice' },
  swot: { title: 'SWOT Generator', subtitle: 'AI-generated strategic analyses' },
  reports: { title: 'AI Report Generator', subtitle: 'Daily, weekly, monthly, executive reports' },
  chat: { title: 'AI Chat Assistant', subtitle: 'Ask questions about your competitors' },
  analytics: { title: 'Analytics', subtitle: 'Cross-competitor market trends' },
  alerts: { title: 'Alerts', subtitle: 'Critical competitor events needing attention' },
  agents: { title: 'AI Agents', subtitle: 'Specialized monitoring agents status' },
  digest: { title: 'Weekly Digest', subtitle: 'Top changes across all competitors this week' },
}

function AppShell() {
  const [active, setActive] = React.useState<NavKey>('dashboard')
  const [collapsed, setCollapsed] = React.useState(false)

  const { data: alertsData } = useQuery<{ alerts: any[] }>({
    queryKey: ['alerts', 'all'],
    queryFn: async () => (await fetch('/api/alerts')).json(),
  })
  const alertCount = (alertsData?.alerts ?? []).filter((a) => !a.isRead).length

  const meta = TITLE_MAP[active]

  const renderView = () => {
    switch (active) {
      case 'dashboard': return <DashboardView onNavigate={setActive} />
      case 'competitors': return <CompetitorsView />
      case 'website': return <WebsiteView />
      case 'news': return <NewsView />
      case 'products': return <ProductsView />
      case 'pricing': return <PricingView />
      case 'careers': return <CareersView />
      case 'social': return <SocialView />
      case 'reviews': return <ReviewsView />
      case 'swot': return <SwotView />
      case 'reports': return <ReportsView />
      case 'chat': return <ChatView />
      case 'analytics': return <AnalyticsView />
      case 'alerts': return <AlertsView />
      case 'agents': return <AgentsView />
      case 'digest': return <DigestView />
      default: return <DashboardView onNavigate={setActive} />
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        active={active}
        onChange={setActive}
        alertCount={alertCount}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          alertCount={alertCount}
          active={active}
          onChange={setActive}
          onOpenAlerts={() => setActive('alerts')}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
          <div className="max-w-[1600px] mx-auto">
            {renderView()}
          </div>
          <footer className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">CompeteIQ</span> — AI Competitor Intelligence Agent ·
              Monitoring {NAV_GROUPS.reduce((s, g) => s + g.items.length, 0)} intelligence modules ·
              {' '}{new Date().getFullYear()}
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}

// Auth gate: routes based on authentication + onboarding state.
function AuthGate() {
  const { state } = useAuth()

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading CompeteIQ…</p>
        </div>
      </div>
    )
  }

  if (state.status === 'unauthenticated') {
    return <LandingPage />
  }

  if (state.phase === 'onboarding') {
    return <OnboardingScreen />
  }

  if (state.phase === 'first-scan') {
    return <FirstScanScreen />
  }

  return <AppShell />
}

export default function Home() {
  return (
    <Providers>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </Providers>
  )
}
