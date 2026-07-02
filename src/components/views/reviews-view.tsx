'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Pie, PieChart, Legend, RadialBar, RadialBarChart,
} from 'recharts'
import { Star, ThumbsUp, ThumbsDown, MessageSquareWarning, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, SentimentBadge, timeAgo, EmptyState } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, slideInRight } from '@/lib/animations'

const SOURCES = ['G2', 'Capterra', 'Product Hunt', 'Trustpilot', 'Google Reviews']
const COLORS = ['#22d3ee', '#e879f9', '#fbbf24', '#fb7185', '#a78bfa']

export function ReviewsView() {
  const [source, setSource] = React.useState('all')
  const { data } = useQuery<{ reviews: any[] }>({
    queryKey: ['reviews', source],
    queryFn: async () => {
      const url = source === 'all' ? '/api/reviews' : `/api/reviews?source=${source}`
      const res = await fetch(url)
      return res.json()
    },
  })

  const reviews = data?.reviews ?? []

  // Sentiment distribution
  const sentimentPie = ['Positive', 'Neutral', 'Negative'].map((s) => ({
    name: s,
    value: reviews.filter((r) => r.sentiment === s).length,
  })).filter((x) => x.value > 0)

  // Category distribution
  const catCounts: Record<string, number> = {}
  for (const r of reviews) catCounts[r.category] = (catCounts[r.category] || 0) + 1
  const catChart = Object.entries(catCounts).map(([name, count]) => ({ name, count }))

  // Average rating
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const ratingBuckets = [5, 4, 3, 2, 1].map((bucket) => ({
    rating: `${bucket}★`,
    count: reviews.filter((r) => Math.floor(r.rating) === bucket).length,
  }))

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Customer Review Intelligence"
          description="AI agent analyzes reviews across G2, Capterra, Product Hunt, Trustpilot & Google"
          icon={Star}
          actions={
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </motion.div>

      {/* Stat tiles */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Star className="size-5 text-chart-3" />
            <div>
              <p className="text-xl font-bold leading-none">{avgRating.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg Rating</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <ThumbsUp className="size-5 text-chart-4" />
            <div>
              <p className="text-xl font-bold leading-none">{reviews.filter((r) => r.sentiment === 'Positive').length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Positive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <ThumbsDown className="size-5 text-rose-500" />
            <div>
              <p className="text-xl font-bold leading-none">{reviews.filter((r) => r.sentiment === 'Negative').length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Negative</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <MessageSquareWarning className="size-5 text-chart-2" />
            <div>
              <p className="text-xl font-bold leading-none">{reviews.filter((r) => r.category === 'Complaint').length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Complaints</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sentiment Distribution</CardTitle>
            <CardDescription>Across all monitored reviews</CardDescription>
          </CardHeader>
          <CardContent>
            {sentimentPie.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-12">No reviews yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={sentimentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {sentimentPie.map((entry, i) => (
                      <Cell key={i} fill={entry.name === 'Positive' ? '#a3e635' : entry.name === 'Negative' ? '#fb7185' : '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reviews by Category</CardTitle>
            <CardDescription>Praise, complaints, feature requests, and bugs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={catChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {catChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews detected" description="The Review Agent is scanning G2, Capterra, Product Hunt, Trustpilot, and Google Reviews." />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {reviews.map((r) => (
            <motion.div key={r.id} variants={slideInRight}>
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                    {r.competitor?.logo || '⭐'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold">{r.competitor?.name}</span>
                      <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                      <div className="inline-flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`size-3 ${n <= Math.round(r.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                        ))}
                        <span className="text-[10px] font-medium ml-1">{r.rating.toFixed(1)}</span>
                      </div>
                      <SentimentBadge sentiment={r.sentiment} />
                      {r.category && <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>}
                      <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(r.publishedAt)}</span>
                    </div>
                    <p className="text-sm font-medium mb-1">{r.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.content}</p>
                    {r.author && (
                      <p className="text-[10px] text-muted-foreground mt-2">— {r.author}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
