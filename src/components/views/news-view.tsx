'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Newspaper, ExternalLink, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, SeverityBadge, SentimentBadge, timeAgo, EmptyState } from '@/components/shared/primitives'

const CATEGORIES = ['Funding', 'Acquisition', 'Expansion', 'Partnership', 'Award', 'Leadership', 'Product Launch']

export function NewsView() {
  const [category, setCategory] = React.useState('all')
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
    <div>
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

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
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
      </div>

      {news.length === 0 ? (
        <EmptyState icon={Newspaper} title="No news articles yet" description="The News Agent is scanning Google News, RSS feeds, and press releases." />
      ) : (
        <div className="space-y-3">
          {news.map((n) => (
            <Card key={n.id} className="hover:border-primary/30 transition-colors">
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
                        <a href={n.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                          Source <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
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
