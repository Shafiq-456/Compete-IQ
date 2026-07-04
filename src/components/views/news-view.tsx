'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Newspaper, ExternalLink, Sparkles, ShieldCheck, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, SeverityBadge, SentimentBadge, timeAgo, EmptyState } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, slideInRight } from '@/lib/animations'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const CATEGORIES = ['Funding', 'Acquisition', 'Expansion', 'Partnership', 'Award', 'Leadership', 'Product Launch']

export function NewsView() {
  const [category, setCategory] = React.useState('all')
  const [selectedNews, setSelectedNews] = React.useState<any | null>(null)
  const { data } = useQuery<{ news: any[] }>({
    queryKey: ['news', category],
    queryFn: async () => {
      const url = category === 'all' ? '/api/news' : `/api/news?category=${category}`
      const res = await fetch(url)
      return res.json()
    },
  })

  const news = data?.news ?? []
  const categoryCounts: Record<string, number> = {}
  for (const n of news) categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="News Intelligence"
          description="AI agent summarizes competitor news — funding, M&A, partnerships, leadership, and product launches"
          icon={Newspaper}
          actions={
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </motion.div>

      {/* Category tabs */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setCategory('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${category === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}
        >
          All ({news.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${category === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}
          >
            {cat} ({categoryCounts[cat] ?? 0})
          </button>
        ))}
      </motion.div>

      {news.length === 0 ? (
        <EmptyState icon={Newspaper} title="No news articles yet" description="The News Agent is scanning Google News, RSS feeds, and press releases." />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {news.map((n) => (
            <motion.div key={n.id} variants={slideInRight}>
            <Card
              className="hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelectedNews(n)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                    {n.competitor?.logo || '📰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold">{n.competitor?.name}</span>
                      <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                      <SentimentBadge sentiment={n.sentiment} />
                      <SeverityBadge severity={n.impact} />
                      <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(n.publishedAt)}</span>
                    </div>
                    <h3 className="text-sm font-semibold leading-tight">{n.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.summary}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">{n.source}</Badge>
                      {n.url && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                          Inspect Source <ExternalLink className="size-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Live Source Accreditation Preview Modal */}
      <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent className="max-w-xl border-glass bg-card/85 backdrop-blur-xl">
          {selectedNews && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-base">
                    {selectedNews.competitor?.logo || '🏢'}
                  </div>
                  <div>
                    <DialogTitle className="text-sm font-bold">{selectedNews.competitor?.name}</DialogTitle>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(selectedNews.publishedAt)}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{selectedNews.category}</Badge>
                </div>
                <DialogTitle className="text-base font-bold leading-tight mt-1">
                  {selectedNews.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                {/* AI Summary Section */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gradient uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="size-3 text-accent" />
                    AI Intelligence Summary
                  </span>
                  <p className="text-xs leading-relaxed text-foreground p-3 rounded-lg border border-glass bg-muted/30">
                    {selectedNews.summary}
                  </p>
                </div>

                {/* Source Verification & Accreditation Panel */}
                <div className="p-3.5 rounded-xl border border-glass bg-muted/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gradient uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                      Source Verification
                    </span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] hover:bg-emerald-500/20 font-bold uppercase tracking-wider">
                      Accredited Source
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Publisher Domain</span>
                      <span className="text-muted-foreground">{selectedNews.source}</span>
                    </div>
                    {selectedNews.url && (
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Original Resource Link</span>
                        <a
                          href={selectedNews.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 truncate max-w-[240px]"
                        >
                          {selectedNews.url.replace('https://', '').replace('www.', '').slice(0, 32)}...
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mock Live Reader View Preview */}
                {selectedNews.url && (
                  <div className="rounded-lg border border-glass overflow-hidden bg-background/50">
                    <div className="bg-muted/50 px-3 py-1.5 border-b border-glass flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <Globe className="size-3" />
                        Live Reader View Preview
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="p-3.5 space-y-2">
                      <h4 className="text-xs font-bold">{selectedNews.title}</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Accredited intelligence parsed by scan agents. Click below to view full original publication details directly from the source host.
                      </p>
                      <Button
                        onClick={() => window.open(selectedNews.url, '_blank')}
                        className="w-full text-[11px] font-bold py-3 mt-1.5 flex items-center justify-center gap-1.5 border border-glass bg-muted/40 hover:bg-muted/65"
                        variant="outline"
                      >
                        <ExternalLink className="size-3.5" />
                        Visit Original Source Website
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
