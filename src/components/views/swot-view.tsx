'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Grid3x3, Sparkles, RefreshCw, Check, AlertTriangle, TrendingUp,
  TrendingDown, Lightbulb, ShieldAlert,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, EmptyState } from '@/components/shared/primitives'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, scaleIn } from '@/lib/animations'

export function SwotView() {
  const qc = useQueryClient()
  const [competitorId, setCompetitorId] = React.useState<string>('')

  const { data: compData } = useQuery<{ competitors: any[] }>({
    queryKey: ['competitors'],
    queryFn: async () => (await fetch('/api/competitors')).json(),
  })

  React.useEffect(() => {
    if (!competitorId && compData?.competitors?.length) {
      setCompetitorId(compData.competitors[0].id)
    }
  }, [compData, competitorId])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['swot', competitorId],
    queryFn: async () => {
      if (!competitorId) return null
      const res = await fetch(`/api/swot?competitorId=${competitorId}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: !!competitorId,
  })

  const regenerateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/swot?competitorId=${id}&force=true`)
      if (!res.ok) throw new Error('Failed to regenerate SWOT')
      return res.json()
    },
    onSuccess: () => {
      toast.success('SWOT regenerated with fresh AI analysis')
      qc.invalidateQueries({ queryKey: ['swot', competitorId] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const swot = data?.swot
  const competitor = compData?.competitors?.find((c) => c.id === competitorId)

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="SWOT Analysis Generator"
          description="AI-powered Strengths, Weaknesses, Opportunities, Threats analysis"
          icon={Grid3x3}
          actions={
            <div className="flex items-center gap-2">
              <Select value={competitorId} onValueChange={setCompetitorId}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Select competitor" /></SelectTrigger>
                <SelectContent>
                  {(compData?.competitors ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => competitorId && regenerateMutation.mutate(competitorId)}
                disabled={!competitorId || regenerateMutation.isPending}
              >
                <RefreshCw className={`size-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
          }
        />
      </motion.div>

      {!competitorId ? (
        <EmptyState icon={Grid3x3} title="Select a competitor" description="Choose a competitor to view or generate their SWOT analysis." />
      ) : isLoading || isFetching ? (
        <SwotSkeleton />
      ) : !swot ? (
        <EmptyState
          icon={Grid3x3}
          title="No SWOT yet"
          description="Click Regenerate to generate an AI-powered SWOT analysis."
          action={
            <Button onClick={() => regenerateMutation.mutate(competitorId)}>
              <Sparkles className="size-4" />
              Generate SWOT
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Summary card */}
          <motion.div variants={scaleIn}>
            <Card className="bg-gradient-to-br from-primary/10 to-chart-5/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-lg">{competitor?.logo}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold">{competitor?.name} — Executive Summary</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{swot.summary}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Sparkles className="size-3" />
                      Generated {new Date(swot.generatedAt).toLocaleString()}
                      {data?.cached && <span className="text-chart-4">· Cached</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* SWOT grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <motion.div variants={scaleIn} className="h-full"><SwotQuadrant
              title="Strengths"
              icon={Check}
              color="emerald"
              items={Array.isArray(swot.strengths) ? swot.strengths : []}
            /></motion.div>
            <motion.div variants={scaleIn} className="h-full"><SwotQuadrant
              title="Weaknesses"
              icon={AlertTriangle}
              color="red"
              items={Array.isArray(swot.weaknesses) ? swot.weaknesses : []}
            /></motion.div>
            <motion.div variants={scaleIn} className="h-full"><SwotQuadrant
              title="Opportunities"
              icon={TrendingUp}
              color="cyan"
              items={Array.isArray(swot.opportunities) ? swot.opportunities : []}
            /></motion.div>
            <motion.div variants={scaleIn} className="h-full"><SwotQuadrant
              title="Threats"
              icon={ShieldAlert}
              color="amber"
              items={Array.isArray(swot.threats) ? swot.threats : []}
            /></motion.div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

const COLOR_MAP: Record<string, { bg: string; icon: string; bullet: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-500/5 border-emerald-500/30', icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', bullet: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
  red: { bg: 'bg-red-500/5 border-red-500/30', icon: 'bg-red-500/15 text-red-600 dark:text-red-400', bullet: 'bg-red-500', ring: 'ring-red-500/20' },
  cyan: { bg: 'bg-cyan-500/5 border-cyan-500/30', icon: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400', bullet: 'bg-cyan-500', ring: 'ring-cyan-500/20' },
  amber: { bg: 'bg-amber-500/5 border-amber-500/30', icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', bullet: 'bg-amber-500', ring: 'ring-amber-500/20' },
}

function SwotQuadrant({
  title, icon: Icon, color, items,
}: {
  title: string; icon: any; color: string; items: string[]
}) {
  const cfg = COLOR_MAP[color]
  return (
    <Card className={`border ${cfg.bg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`size-8 rounded-lg flex items-center justify-center ${cfg.icon}`}>
            <Icon className="size-4" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="ml-auto text-xs text-muted-foreground">{items.length} items</span>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No items</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className={`size-1.5 rounded-full ${cfg.bullet} mt-2 shrink-0`} />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function SwotSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  )
}
