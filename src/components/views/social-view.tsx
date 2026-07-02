'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import { Share2, Heart, MessageCircle, Eye, Repeat2, Youtube, Linkedin, Twitter, Instagram, Facebook } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, SentimentBadge, timeAgo, formatNumber, EmptyState } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, slideInRight } from '@/lib/animations'

const PLATFORMS = ['LinkedIn', 'X', 'YouTube', 'Instagram', 'Facebook']
const PLATFORM_ICONS: Record<string, any> = {
  LinkedIn: Linkedin, X: Twitter, YouTube: Youtube, Instagram: Instagram, Facebook: Facebook,
}
const COLORS = ['#22d3ee', '#e879f9', '#fbbf24', '#fb7185', '#a78bfa']

export function SocialView() {
  const [platform, setPlatform] = React.useState('all')
  const { data } = useQuery<{ posts: any[] }>({
    queryKey: ['social', platform],
    queryFn: async () => {
      const url = platform === 'all' ? '/api/social' : `/api/social?platform=${platform}`
      const res = await fetch(url)
      return res.json()
    },
  })

  const posts = data?.posts ?? []

  // Engagement by competitor
  const byCompetitor: Record<string, { likes: number; comments: number; shares: number; views: number }> = {}
  for (const p of posts) {
    const name = p.competitor?.name ?? 'Unknown'
    if (!byCompetitor[name]) byCompetitor[name] = { likes: 0, comments: 0, shares: 0, views: 0 }
    byCompetitor[name].likes += p.likes
    byCompetitor[name].comments += p.comments
    byCompetitor[name].shares += p.shares
    byCompetitor[name].views += p.views
  }
  const chart = Object.entries(byCompetitor).map(([name, v]) => ({ name, ...v }))

  // Platform distribution
  const platformCounts: Record<string, number> = {}
  for (const p of posts) platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Social Media Intelligence"
          description="AI agent monitors posts, campaigns, announcements, and engagement across platforms"
          icon={Share2}
          actions={
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All platforms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </motion.div>

      {/* Platform tabs */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setPlatform('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${platform === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}
        >
          All ({posts.length})
        </button>
        {PLATFORMS.map((p) => {
          const Icon = PLATFORM_ICONS[p]
          return (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${platform === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}
            >
              <Icon className="size-3" />
              {p} ({platformCounts[p] ?? 0})
            </button>
          )
        })}
      </motion.div>

      {/* Engagement chart */}
      <motion.div variants={fadeUp} className="mb-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Engagement by Competitor</CardTitle>
          <CardDescription>Total likes, comments, and shares across monitored posts</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} formatter={(value: any) => formatNumber(value)} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="likes" fill="#fb7185" name="Likes" radius={[3, 3, 0, 0]} />
              <Bar dataKey="comments" fill="#fbbf24" name="Comments" radius={[3, 3, 0, 0]} />
              <Bar dataKey="shares" fill="#a3e635" name="Shares" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* Posts feed */}
      {posts.length === 0 ? (
        <EmptyState icon={Share2} title="No social posts detected" description="The Social Agent is scanning LinkedIn, X, YouTube, Instagram, and Facebook." />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {posts.map((p) => {
            const Icon = PLATFORM_ICONS[p.platform] ?? Share2
            return (
              <motion.div key={p.id} variants={slideInRight}>
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                      {p.competitor?.logo || '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-sm font-semibold">{p.competitor?.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          <Icon className="size-2.5 mr-0.5" />{p.platform}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">{p.postType}</Badge>
                        <SentimentBadge sentiment={p.sentiment} />
                        <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(p.publishedAt)}</span>
                      </div>
                      <p className="text-sm leading-relaxed mb-3">{p.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="size-3 text-rose-500" />
                          {formatNumber(p.likes)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="size-3 text-chart-3" />
                          {formatNumber(p.comments)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Repeat2 className="size-3 text-chart-4" />
                          {formatNumber(p.shares)}
                        </span>
                        {p.views > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Eye className="size-3 text-chart-1" />
                            {formatNumber(p.views)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
