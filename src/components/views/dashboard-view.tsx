'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import {
  Building2, Activity, AlertTriangle, Newspaper, DollarSign, Rocket,
  Users, MessageSquare, Star, Sparkles, TrendingUp, ArrowRight,
  Lightbulb, RefreshCw, type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SeverityBadge, timeAgo, formatNumber } from '@/components/shared/primitives'
import { toast } from 'sonner'
import { type NavKey } from '@/lib/nav'
import { useAuth } from '@/components/auth/auth-provider'
import { UpgradeBanner } from '@/components/shared/upgrade-banner'
import { fadeUp, scaleIn, slideInRight, staggerContainer, staggerContainerFast, glowPulse, hoverGlow, hoverLift } from '@/lib/animations'

type DashboardData = {
  stats: {
    competitors: number; changesToday: number; criticalAlerts: number;
    newsArticles: number; priceChanges: number; productLaunches: number;
    jobPostings: number; socialPosts: number; reviews: number;
  }
  competitors: any[]
  recentChanges: any[]
  recentAlerts: any[]
  recentNews: any[]
  insights: any[]
  pricingChanges: any[]
  products: any[]
  jobPostings: any[]
  socialPosts: any[]
  reviews: any[]
}

/* Aurora Cyberpunk chart palette — vivid neon-leaning
   cyan, magenta, amber/gold, lime, violet, sky, rose, orange */
const COLORS = ['#22d3ee', '#e879f9', '#fbbf24', '#a3e635', '#a78bfa', '#38bdf8', '#fb7185', '#fb923c']

export function DashboardView({ onNavigate }: { onNavigate: (k: NavKey) => void }) {
  const { state } = useAuth()
  const userName = state.status === 'authenticated' ? (state.user.name || 'there') : 'there'
  const { data, isLoading, refetch, isFetching } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      const j = await res.json()
      return j
    },
  })

  const stats = data?.stats

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Hero header */}
      <motion.div
        variants={scaleIn}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-chart-5/10 border border-primary/20 p-6"
      >
        {/* Shooting stars */}
        <div className="meteor" aria-hidden />
        <div className="meteor meteor-2" aria-hidden />
        <div className="absolute top-0 right-0 -mt-8 -mr-8 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <motion.div
              variants={glowPulse}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider mb-2"
            >
              <Sparkles className="size-3" />
              AI-Powered Market Intelligence
            </motion.div>
            <h2 className="text-2xl font-bold tracking-tight">
              <span className="text-gradient">Good morning, {userName}</span> 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {stats?.changesToday ?? 0} competitor changes detected today ·{' '}
              {stats?.criticalAlerts ?? 0} critical alerts need attention ·{' '}
              {stats?.newsArticles ?? 0} news articles analyzed this week.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => onNavigate('chat')}>
              <Sparkles className="size-4" />
              Ask AI
            </Button>
          </div>
        </div>
      </motion.div>

      <UpgradeBanner />

      {/* KPI cards */}
      <motion.div
        variants={staggerContainerFast}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <KpiCard icon={Building2} label="Competitors" value={stats?.competitors ?? 0} color="text-chart-1" onClick={() => onNavigate('competitors')} />
        <KpiCard icon={Activity} label="Changes Today" value={stats?.changesToday ?? 0} color="text-chart-2" onClick={() => onNavigate('website')} />
        <KpiCard icon={AlertTriangle} label="Critical Alerts" value={stats?.criticalAlerts ?? 0} color="text-rose-500" onClick={() => onNavigate('alerts')} />
        <KpiCard icon={Newspaper} label="News Articles" value={stats?.newsArticles ?? 0} color="text-chart-3" onClick={() => onNavigate('news')} />
        <KpiCard icon={DollarSign} label="Price Changes" value={stats?.priceChanges ?? 0} color="text-chart-5" onClick={() => onNavigate('pricing')} />
        <KpiCard icon={Rocket} label="Product Launches" value={stats?.productLaunches ?? 0} color="text-chart-2" onClick={() => onNavigate('products')} />
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity timeline */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Activity Timeline</CardTitle>
                <CardDescription>14-day competitor activity overview</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </CardHeader>
            <CardContent>
              <ActivityTimelineChart data={data} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts by severity */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Alerts by Severity</CardTitle>
              <CardDescription>Distribution across all competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsSeverityChart data={data} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Insights */}
        <motion.div variants={fadeUp} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="size-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Insights</CardTitle>
                  <CardDescription>Auto-generated by Trend Agent</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => generateInsight(refetch)}>
                <Sparkles className="size-3" />
                New
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px] pr-3">
                <div className="space-y-3">
                  {(data?.insights ?? []).map((ins) => (
                    <div key={ins.id} className="rounded-lg border p-3 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm font-medium leading-tight">{ins.title}</p>
                        <SeverityBadge severity={ins.impact} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{ins.content}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <span className="text-[10px] text-muted-foreground">{ins.agentType}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(ins.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  {(!data?.insights || data.insights.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-8">No insights yet</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent changes feed */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Recent Changes</CardTitle>
                <CardDescription>Latest detected competitor activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate('website')}>
                View all
                <ArrowRight className="size-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px] pr-3">
                <div className="space-y-2.5">
                  {(data?.recentChanges ?? []).map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/40 transition-colors">
                      <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                        {c.competitor?.logo || '🏢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{c.competitor?.name}</span>
                          <Badge variant="outline" className="text-[10px] py-0">{c.changeType}</Badge>
                          <SeverityBadge severity={c.severity} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.summary}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{c.pageType} · {timeAgo(c.detectedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row: pricing + news + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="size-4 text-chart-5" />
                Pricing Changes
              </CardTitle>
              <CardDescription>Recent price adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[260px] pr-3">
                <div className="space-y-2">
                  {(data?.pricingChanges ?? []).slice(0, 8).map((p) => {
                    const prev = p.previousPrice ?? p.price
                    const pct = prev ? ((p.price - prev) / prev) * 100 : 0
                    const down = pct < 0
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-2 text-sm py-1.5 border-b last:border-0">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.competitor?.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{p.planName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-mono">
                            <span className="line-through text-muted-foreground">${prev}</span>{' '}
                            <span className="font-semibold">${p.price}</span>
                          </p>
                          <p className={`text-[10px] font-medium ${down ? 'text-chart-4' : 'text-rose-500'}`}>
                            {down ? '↓' : '↑'} {Math.abs(pct).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Newspaper className="size-4 text-chart-3" />
                Latest News
              </CardTitle>
              <CardDescription>Recent competitor news</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[260px] pr-3">
                <div className="space-y-2.5">
                  {(data?.recentNews ?? []).map((n) => (
                    <div key={n.id} className="py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs">{n.competitor?.logo}</span>
                        <span className="text-[10px] text-muted-foreground">{n.competitor?.name}</span>
                        <Badge variant="outline" className="text-[9px] py-0 ml-auto">{n.category}</Badge>
                      </div>
                      <p className="text-xs font-medium leading-tight line-clamp-2">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.publishedAt)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="size-4 text-rose-500" />
                Critical Alerts
              </CardTitle>
              <CardDescription>Need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[260px] pr-3">
                <div className="space-y-2">
                  {(data?.recentAlerts ?? []).map((a) => (
                    <div key={a.id} className="rounded-lg border p-2.5 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <SeverityBadge severity={a.severity} />
                        <span className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                      </div>
                      <p className="text-xs font-medium leading-tight">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                      {a.competitor && (
                        <p className="text-[10px] text-muted-foreground mt-1">{a.competitor.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Competitors overview strip */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tracked Competitors</CardTitle>
            <CardDescription>Quick overview of monitored companies</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={staggerContainerFast}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            >
              {(data?.competitors ?? []).slice(0, 8).map((c) => (
                <motion.button
                  key={c.id}
                  variants={slideInRight}
                  whileHover={hoverLift}
                  onClick={() => onNavigate('competitors')}
                  className="text-left rounded-xl border bg-card p-3 hover:border-primary/40 hover:shadow-md transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-base">{c.logo || '🏢'}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{c.country}</span>
                    <SeverityBadge severity={c.priority === 'High' ? 'High' : c.priority === 'Medium' ? 'Medium' : 'Low'} />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function KpiCard({
  icon: Icon, label, value, color, onClick,
}: {
  icon: LucideIcon; label: string; value: number; color: string; onClick?: () => void
}) {
  return (
    <motion.button
      variants={fadeUp}
      whileHover={hoverGlow}
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border bg-card p-4 text-left hover:border-primary/40 transition-colors"
    >
      <div className="absolute -right-4 -top-4 size-16 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
      <div className="relative flex items-center justify-between mb-2">
        <Icon className={`size-5 ${color}`} />
        <TrendingUp className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="relative text-2xl font-bold tracking-tight">{value}</p>
      <p className="relative text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </motion.button>
  )
}

function ActivityTimelineChart({ data }: { data?: DashboardData }) {
  // Build last 14 days from data
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days: { date: string; changes: number; news: number; alerts: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const next = new Date(d); next.setDate(d.getDate() + 1)
    days.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      changes: (data?.recentChanges ?? []).filter((c) => {
        const t = new Date(c.detectedAt); return t >= d && t < next
      }).length,
      news: (data?.recentNews ?? []).filter((n) => {
        const t = new Date(n.publishedAt); return t >= d && t < next
      }).length,
      alerts: (data?.recentAlerts ?? []).filter((a) => {
        const t = new Date(a.createdAt); return t >= d && t < next
      }).length,
    })
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={days} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e879f9" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#e879f9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        <Area type="monotone" dataKey="changes" stroke="#22d3ee" fill="url(#g1)" name="Changes" />
        <Area type="monotone" dataKey="news" stroke="#e879f9" fill="url(#g2)" name="News" />
        <Area type="monotone" dataKey="alerts" stroke="#fbbf24" fill="url(#g3)" name="Alerts" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function AlertsSeverityChart({ data }: { data?: DashboardData }) {
  const alerts = data?.recentAlerts ?? []
  const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const a of alerts) counts[a.severity] = (counts[a.severity] || 0) + 1
  const pieData = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
  const colorMap: Record<string, string> = {
    Critical: '#fb7185', High: '#fb923c', Medium: '#fbbf24', Low: '#a3e635',
  }
  if (pieData.length === 0) {
    return <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">No alerts</div>
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
          {pieData.map((entry, i) => (
            <Cell key={i} fill={colorMap[entry.name]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

async function generateInsight(refetch: () => void) {
  const t = toast.loading('Generating AI insight…')
  try {
    const res = await fetch('/api/insights', { method: 'POST' })
    if (!res.ok) throw new Error('Failed')
    toast.success('New AI insight generated', { id: t })
    refetch()
  } catch (e: any) {
    toast.error(e.message ?? 'Failed to generate insight', { id: t })
  }
}
