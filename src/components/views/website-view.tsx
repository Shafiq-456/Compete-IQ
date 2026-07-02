'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Globe, ArrowRight, ExternalLink, Filter, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, SeverityBadge, timeAgo, EmptyState } from '@/components/shared/primitives'

const CHANGE_TYPE_LABEL: Record<string, string> = {
  NewPage: 'New Page',
  RemovedPage: 'Removed Page',
  TextChange: 'Text Change',
  UIChange: 'UI Change',
  CTAChange: 'CTA Change',
  FeatureUpdate: 'Feature Update',
}

export function WebsiteView() {
  const [competitorId, setCompetitorId] = React.useState('all')
  const { data } = useQuery<{ changes: any[] }>({
    queryKey: ['changes', competitorId],
    queryFn: async () => {
      const url = competitorId === 'all' ? '/api/changes' : `/api/changes?competitorId=${competitorId}`
      const res = await fetch(url)
      return res.json()
    },
  })
  const { data: compData } = useQuery<{ competitors: any[] }>({
    queryKey: ['competitors'],
    queryFn: async () => {
      const res = await fetch('/api/competitors')
      return res.json()
    },
  })

  const changes = data?.changes ?? []

  return (
    <div>
      <PageHeader
        title="Website Monitoring"
        description="AI agent detects page, content, UI, and CTA changes across competitor websites"
        icon={Globe}
        actions={
          <Select value={competitorId} onValueChange={setCompetitorId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All competitors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All competitors</SelectItem>
              {(compData?.competitors ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatTile label="Total Changes" value={changes.length} color="text-emerald-500" />
        <StatTile label="Critical" value={changes.filter((c) => c.severity === 'Critical').length} color="text-red-500" />
        <StatTile label="High" value={changes.filter((c) => c.severity === 'High').length} color="text-orange-500" />
        <StatTile label="New Pages" value={changes.filter((c) => c.changeType === 'NewPage').length} color="text-cyan-500" />
      </div>

      {changes.length === 0 ? (
        <EmptyState icon={Globe} title="No website changes detected yet" description="The Website Agent is scanning competitor pages — changes will appear here in real time." />
      ) : (
        <div className="space-y-3">
          {changes.map((c) => (
            <Card key={c.id} className="overflow-hidden hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                    {c.competitor?.logo || '🏢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{c.competitor?.name}</span>
                      <Badge variant="outline" className="text-[10px]">{CHANGE_TYPE_LABEL[c.changeType] ?? c.changeType}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{c.pageType}</Badge>
                      <SeverityBadge severity={c.severity} />
                      <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(c.detectedAt)}</span>
                    </div>
                    <p className="text-sm font-medium mb-2">{c.summary}</p>
                    <p className="text-[10px] text-muted-foreground truncate mb-2">{c.pageTitle} · {c.pageUrl}</p>

                    {(c.beforeContent || c.afterContent) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {c.beforeContent && (
                          <div className="rounded-lg bg-muted/40 p-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Before</p>
                            <p className="text-xs line-clamp-2">{c.beforeContent}</p>
                          </div>
                        )}
                        {c.afterContent && (
                          <div className="rounded-lg bg-emerald-500/10 p-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">After</p>
                            <p className="text-xs line-clamp-2">{c.afterContent}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}
