'use client'

// Stage D: Weekly Digest view.
// Aggregates the most important changes across all tracked competitors from the
// past 7 days, grouped by category. Mimics Crayon's "insights delivered to inbox"
// habit loop without needing real email infrastructure.
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Inbox, TrendingUp, TrendingDown, DollarSign, Package, Newspaper, Users,
  Globe, Star, AlertTriangle, Sparkles, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, SeverityBadge, timeAgo } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, scaleIn } from '@/lib/animations'
import { type NavKey } from '@/lib/nav'

type DigestData = {
  period: { from: string; to: string }
  niche: string | null
  businessName: string | null
  totals: Record<string, number>
  competitorsByThreat: Array<{ id: string; name: string; logo: string; industry: string; threatLevel: string; status: string }>
  highlights: {
    pricing: any[]
    products: any[]
    news: any[]
    hiring: any[]
    website: any[]
    reviews: any[]
    alerts: any[]
  }
}

const THREAT_RANK: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 }

const THREAT_STYLE: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  High: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  Medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  Low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
}

export function DigestView({ onNavigate }: { onNavigate?: (k: NavKey) => void }) {
  const { data: resp, isLoading } = useQuery<{ digest: DigestData | null }>({
    queryKey: ['digest'],
    queryFn: async () => (await fetch('/api/digest')).json(),
  })
  const data = resp?.digest

  if (isLoading) return <DigestSkeleton />

  if (!data || data.totals.competitors === 0) {
    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <PageHeader
            title="Weekly Digest"
            description="Top changes across all your competitors in the past 7 days"
            icon={Inbox}
          />
        </motion.div>
        <Card>
          <CardContent className="p-8 text-center">
            <Inbox className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No digest yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add competitors and run a scan to see your weekly digest.</p>
            {onNavigate && (
              <Button size="sm" className="mt-3" onClick={() => onNavigate('competitors')}>
                Add competitors
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const t = data.totals
  const fromDate = new Date(data.period.from).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Weekly Digest"
          description={`Top changes across all your competitors — past 7 days (since ${fromDate})`}
          icon={Inbox}
          actions={
            data.niche && (
              <Badge variant="outline" className="text-xs">
                <Sparkles className="size-3 mr-1 text-primary" />
                {data.niche} niche
              </Badge>
            )
          }
        />
      </motion.div>

      {/* Totals strip */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
        <StatTile icon={Newspaper} label="News" value={t.news} color="text-chart-3" />
        <StatTile icon={DollarSign} label="Pricing" value={t.pricing} color="text-chart-2" />
        <StatTile icon={Package} label="Products" value={t.products} color="text-chart-4" />
        <StatTile icon={Users} label="Hiring" value={t.jobs} color="text-chart-1" />
        <StatTile icon={Globe} label="Website" value={t.changes} color="text-chart-5" />
        <StatTile icon={Star} label="Reviews" value={t.reviews} color="text-chart-3" />
        <StatTile icon={AlertTriangle} label="Alerts" value={t.alerts} color="text-chart-7" />
        <StatTile icon={Sparkles} label="Competitors" value={t.competitors} color="text-primary" />
      </motion.div>

      {/* Competitors by threat level — Stage D requirement */}
      <motion.div variants={fadeUp} className="mb-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="size-4 text-chart-7" />
              Competitors by Priority (threat level)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.competitorsByThreat.map((c) => (
                <motion.div
                  key={c.id}
                  whileHover={{ scale: 1.03 }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${THREAT_STYLE[c.threatLevel] || THREAT_STYLE.Low}`}
                >
                  <span className="text-base">{c.logo}</span>
                  <span className="font-semibold">{c.name}</span>
                  <span className="opacity-70">· {c.threatLevel}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Highlights grid — grouped by category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts (highest priority — full width) */}
        {data.highlights.alerts.length > 0 && (
          <motion.div variants={scaleIn} className="lg:col-span-2">
            <Card className="border-chart-7/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="size-4 text-chart-7" />
                  Critical Alerts (sorted by severity)
                  <span className="ml-auto text-xs text-muted-foreground">{data.highlights.alerts.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {data.highlights.alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-card/50 border">
                    <SeverityBadge severity={a.severity} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                      {a.recommendation && (
                        <p className="text-xs text-primary mt-1 italic">→ {a.recommendation}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(a.when)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pricing changes */}
        {data.highlights.pricing.length > 0 && (
          <motion.div variants={scaleIn}>
            <HighlightCard
              icon={DollarSign}
              color="text-chart-2"
              title="Pricing Changes"
              count={data.highlights.pricing.length}
            >
              {data.highlights.pricing.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                  <div className={`size-8 rounded-md flex items-center justify-center text-xs ${p.direction === 'down' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'}`}>
                    {p.direction === 'down' ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.competitor}</p>
                    <p className="text-xs text-muted-foreground">{p.plan}: {p.change} {p.pct && `(${p.pct}%)`}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(p.when)}</span>
                </div>
              ))}
            </HighlightCard>
          </motion.div>
        )}

        {/* Product launches */}
        {data.highlights.products.length > 0 && (
          <motion.div variants={scaleIn}>
            <HighlightCard
              icon={Package}
              color="text-chart-4"
              title="Product Launches"
              count={data.highlights.products.length}
            >
              {data.highlights.products.map((p, i) => (
                <div key={i} className="p-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{p.product}</p>
                    {p.status === 'Beta' && <Badge variant="outline" className="text-[10px]">Beta</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.competitor} · {p.category}</p>
                  {Array.isArray(p.features) && p.features.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">Features: {p.features.slice(0, 3).join(', ')}</p>
                  )}
                </div>
              ))}
            </HighlightCard>
          </motion.div>
        )}

        {/* News */}
        {data.highlights.news.length > 0 && (
          <motion.div variants={scaleIn}>
            <HighlightCard
              icon={Newspaper}
              color="text-chart-3"
              title="News & Announcements"
              count={data.highlights.news.length}
            >
              {data.highlights.news.map((n, i) => (
                <div key={i} className="p-2 rounded-md hover:bg-muted/50">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.competitor} · {n.category} · {n.source}</p>
                </div>
              ))}
            </HighlightCard>
          </motion.div>
        )}

        {/* Hiring */}
        {data.highlights.hiring.length > 0 && (
          <motion.div variants={scaleIn}>
            <HighlightCard
              icon={Users}
              color="text-chart-1"
              title="Hiring Signals"
              count={data.highlights.hiring.length}
            >
              {data.highlights.hiring.map((j, i) => (
                <div key={i} className="p-2 rounded-md hover:bg-muted/50">
                  <p className="text-sm font-medium">{j.title}</p>
                  <p className="text-xs text-muted-foreground">{j.competitor} · {j.department} · {j.seniority}</p>
                </div>
              ))}
            </HighlightCard>
          </motion.div>
        )}

        {/* Website changes */}
        {data.highlights.website.length > 0 && (
          <motion.div variants={scaleIn}>
            <HighlightCard
              icon={Globe}
              color="text-chart-5"
              title="Website Changes"
              count={data.highlights.website.length}
            >
              {data.highlights.website.map((c, i) => (
                <div key={i} className="p-2 rounded-md hover:bg-muted/50">
                  <p className="text-sm font-medium">{c.changeType} on {c.page}</p>
                  <p className="text-xs text-muted-foreground">{c.competitor} · {c.summary}</p>
                </div>
              ))}
            </HighlightCard>
          </motion.div>
        )}

        {/* Reviews */}
        {data.highlights.reviews.length > 0 && (
          <motion.div variants={scaleIn}>
            <HighlightCard
              icon={Star}
              color="text-chart-3"
              title="Customer Reviews"
              count={data.highlights.reviews.length}
            >
              {data.highlights.reviews.map((r, i) => (
                <div key={i} className="p-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <span className="text-xs">{r.rating}★</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.competitor} · {r.source} · {r.sentiment}</p>
                </div>
              ))}
            </HighlightCard>
          </motion.div>
        )}
      </div>

      {/* CTA to ask AI */}
      {onNavigate && (
        <motion.div variants={fadeUp} className="mt-5 text-center">
          <Button variant="outline" onClick={() => onNavigate('chat')}>
            <Sparkles className="size-4 text-primary" />
            Ask AI about these changes
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

function StatTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <Icon className={`size-4 ${color} mb-1`} />
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </CardContent>
    </Card>
  )
}

function HighlightCard({
  icon: Icon, color, title, count, children,
}: {
  icon: any; color: string; title: string; count: number; children: React.ReactNode
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={`size-4 ${color}`} />
          {title}
          <span className="ml-auto text-xs text-muted-foreground">{count}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
        {children}
      </CardContent>
    </Card>
  )
}

function DigestSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
      </div>
    </div>
  )
}
