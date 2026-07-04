'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Globe, ArrowRight, ExternalLink, Filter, Sparkles, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, SeverityBadge, timeAgo, EmptyState } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, staggerContainerFast, slideInRight } from '@/lib/animations'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  const [selectedChange, setSelectedChange] = React.useState<any | null>(null)
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
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
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
      </motion.div>

      <motion.div variants={staggerContainerFast} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatTile label="Total Changes" value={changes.length} color="text-chart-1" />
        <StatTile label="Critical" value={changes.filter((c) => c.severity === 'Critical').length} color="text-rose-500" />
        <StatTile label="High" value={changes.filter((c) => c.severity === 'High').length} color="text-chart-3" />
        <StatTile label="New Pages" value={changes.filter((c) => c.changeType === 'NewPage').length} color="text-chart-2" />
      </motion.div>

      {changes.length === 0 ? (
        <EmptyState icon={Globe} title="No website changes detected yet" description="The Website Agent is scanning competitor pages — changes will appear here in real time." />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {changes.map((c) => (
            <motion.div key={c.id} variants={slideInRight}>
            <Card
              className="overflow-hidden hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelectedChange(c)}
            >
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
                          <div className="rounded-lg bg-chart-4/10 p-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-chart-4 mb-1">After</p>
                            <p className="text-xs line-clamp-2">{c.afterContent}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Website Change Detail Preview Modal */}
      <Dialog open={!!selectedChange} onOpenChange={(open) => !open && setSelectedChange(null)}>
        <DialogContent className="max-w-xl border-glass bg-card/85 backdrop-blur-xl">
          {selectedChange && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-base">
                    {selectedChange.competitor?.logo || '🏢'}
                  </div>
                  <div>
                    <DialogTitle className="text-sm font-bold">{selectedChange.competitor?.name}</DialogTitle>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(selectedChange.detectedAt)}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{selectedChange.pageType}</Badge>
                </div>
                <DialogTitle className="text-base font-bold leading-tight mt-1">
                  Website Change Detected
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                {/* AI Summary Section */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gradient uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="size-3 text-accent animate-pulse" />
                    Change Summary
                  </span>
                  <p className="text-xs leading-relaxed text-foreground p-3 rounded-lg border border-glass bg-muted/30">
                    {selectedChange.summary}
                  </p>
                </div>

                {/* Diff Viewer */}
                {(selectedChange.beforeContent || selectedChange.afterContent) && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gradient uppercase tracking-wider">Content Differences</span>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {selectedChange.beforeContent && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-300">
                          <p className="text-[9px] uppercase tracking-wider text-red-400 font-bold mb-1">Removed Content</p>
                          <p className="leading-relaxed">{selectedChange.beforeContent}</p>
                        </div>
                      )}
                      {selectedChange.afterContent && (
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
                          <p className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold mb-1">Added Content</p>
                          <p className="leading-relaxed">{selectedChange.afterContent}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Source Verification & Accreditation Panel */}
                <div className="p-3.5 rounded-xl border border-glass bg-muted/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gradient uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                      Live Crawler Verification
                    </span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] hover:bg-emerald-500/20 font-bold uppercase tracking-wider">
                      Verified Scan
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Source Title</span>
                      <span className="text-muted-foreground truncate max-w-[280px]">{selectedChange.pageTitle || 'Target Document'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Target Subpage Path</span>
                      <span className="text-muted-foreground font-mono text-[10px]">{selectedChange.pageUrl || '/'}</span>
                    </div>
                    {selectedChange.competitor?.website && (
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Scraped Website Link</span>
                        <a
                          href={selectedChange.competitor.website.startsWith('http') ? selectedChange.competitor.website : `https://${selectedChange.competitor.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 truncate max-w-[240px]"
                        >
                          {(selectedChange.competitor.website + selectedChange.pageUrl).replace('https://', '').replace('www.', '')}
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
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
