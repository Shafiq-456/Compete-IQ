'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bot, Activity, Clock, CheckCircle2, Zap,
  Globe, Newspaper, DollarSign, Package, Star, Users, Share2, TrendingUp,
  Grid3x3, FileText, Sparkles, type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader, StatusDot, timeAgo } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, staggerContainerFast, scaleIn, hoverLift } from '@/lib/animations'

const AGENT_ICONS: Record<string, LucideIcon> = {
  WebsiteAgent: Globe,
  NewsAgent: Newspaper,
  PricingAgent: DollarSign,
  ProductAgent: Package,
  ReviewAgent: Star,
  CareerAgent: Users,
  SocialAgent: Share2,
  TrendAgent: TrendingUp,
  SWOTAgent: Grid3x3,
  ReportAgent: FileText,
  RecommendationAgent: Sparkles,
}

export function AgentsView() {
  const { data } = useQuery<{ agents: any[] }>({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents')
      return res.json()
    },
    refetchInterval: 30000,
  })

  const agents = data?.agents ?? []
  const active = agents.filter((a) => a.status === 'Active').length
  const totalProcessed = agents.reduce((s, a) => s + a.itemsProcessed, 0)
  const avgSuccess = agents.length ? agents.reduce((s, a) => s + a.successRate, 0) / agents.length : 0

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="AI Agents"
          description="Specialized autonomous agents that monitor, analyze, and report on competitors"
          icon={Bot}
        />
      </motion.div>

      {/* Top stats */}
      <motion.div variants={staggerContainerFast} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Bot className="size-5 text-chart-1" />
            <div>
              <p className="text-xl font-bold leading-none">{agents.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Agents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Activity className="size-5 text-chart-2" />
            <div>
              <p className="text-xl font-bold leading-none">{active}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Active Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Zap className="size-5 text-chart-3" />
            <div>
              <p className="text-xl font-bold leading-none">{totalProcessed.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Items Processed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <CheckCircle2 className="size-5 text-chart-5" />
            <div>
              <p className="text-xl font-bold leading-none">{avgSuccess.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg Success Rate</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {agents.map((a) => {
          const Icon = AGENT_ICONS[a.type] ?? Bot
          return (
            <motion.div key={a.id} variants={scaleIn} whileHover={hoverLift} className="h-full">
            <Card className="hover:border-primary/30 transition-colors h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                      a.status === 'Active' ? 'bg-emerald-500/15' :
                      a.status === 'Paused' ? 'bg-amber-500/15' :
                      a.status === 'Error' ? 'bg-red-500/15' :
                      'bg-muted'
                    }`}>
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm truncate">{a.name}</CardTitle>
                      <CardDescription className="text-[10px]">{a.type}</CardDescription>
                    </div>
                  </div>
                  <StatusDot status={a.status} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">{a.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Items processed</span>
                    <span className="font-mono font-medium">{a.itemsProcessed.toLocaleString()}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Success rate</span>
                      <span className={`font-mono font-medium ${a.successRate >= 99 ? 'text-chart-4' : a.successRate >= 95 ? 'text-chart-3' : 'text-rose-500'}`}>
                        {a.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={a.successRate} className="h-1.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {a.interval}
                  </span>
                  {a.lastRun && (
                    <span>Last run: {timeAgo(a.lastRun)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
