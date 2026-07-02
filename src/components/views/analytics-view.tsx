'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Pie, PieChart, Legend, Area, AreaChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Type } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, staggerContainerFast } from '@/lib/animations'

const COLORS = ['#22d3ee', '#e879f9', '#fbbf24', '#a3e635', '#a78bfa', '#38bdf8', '#fb7185', '#fb923c']

export function AnalyticsView() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      return res.json()
    },
  })

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Analytics" description="Cross-competitor market intelligence dashboard" icon={BarChart3} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="h-64 animate-pulse bg-muted/30" /></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Analytics Dashboard"
          description="Cross-competitor charts, trends, and market insights"
          icon={BarChart3}
        />
      </motion.div>

      {/* Top stat strip */}
      <motion.div variants={staggerContainerFast} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
        <StatTile label="Competitors" value={data.totals.competitors} color="text-chart-1" />
        <StatTile label="News" value={data.totals.news} color="text-chart-2" />
        <StatTile label="Changes" value={data.totals.changes} color="text-chart-3" />
        <StatTile label="Jobs" value={data.totals.jobs} color="text-chart-5" />
        <StatTile label="Social" value={data.totals.social} color="text-chart-2" />
        <StatTile label="Reviews" value={data.totals.reviews} color="text-chart-4" />
        <StatTile label="Alerts" value={data.totals.alerts} color="text-rose-500" />
      </motion.div>

      {/* Activity timeline */}
      <motion.div variants={fadeUp} className="mb-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-chart-1" />
            14-Day Activity Timeline
          </CardTitle>
          <CardDescription>Daily count of changes, news, and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.timeline} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e879f9" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#e879f9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="a3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="changes" stroke="#22d3ee" fill="url(#a1)" name="Changes" />
              <Area type="monotone" dataKey="news" stroke="#e879f9" fill="url(#a2)" name="News" />
              <Area type="monotone" dataKey="alerts" stroke="#fbbf24" fill="url(#a3)" name="Alerts" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* Grid: news by category, sentiment, alerts by severity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="size-4 text-chart-1" />
              News by Category
            </CardTitle>
            <CardDescription>Distribution of news topics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={Object.entries(data.newsByCategory).map(([name, value]) => ({ name, value: value as number }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}
                  label={({ name, value }: any) => `${name}: ${value}`} labelLine={false}
                  style={{ fontSize: '10px' }}
                >
                  {Object.entries(data.newsByCategory).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-chart-4" />
              Review Sentiment
            </CardTitle>
            <CardDescription>Customer voice distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={Object.entries(data.sentimentCounts).map(([name, value]) => ({ name, value: value as number }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}
                >
                  {Object.entries(data.sentimentCounts).map(([name], i) => (
                    <Cell key={i} fill={name === 'Positive' ? '#a3e635' : name === 'Negative' ? '#fb7185' : '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4 text-chart-3" />
              Alerts by Severity
            </CardTitle>
            <CardDescription>Critical / High / Medium / Low</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={Object.entries(data.alertsBySeverity).map(([name, value]) => ({ name, value: value as number }))}
                layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={70} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {Object.entries(data.alertsBySeverity).map(([name], i) => (
                    <Cell key={i} fill={name === 'Critical' ? '#fb7185' : name === 'High' ? '#fb923c' : name === 'Medium' ? '#fbbf24' : '#a3e635'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hiring + rating comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hiring by Competitor</CardTitle>
            <CardDescription>Open position count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.hiringByCompetitor} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.hiringByCompetitor.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg Review Rating by Competitor</CardTitle>
            <CardDescription>Customer satisfaction scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.ratingByCompetitor} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={90} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                  {data.ratingByCompetitor.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.avg >= 4.5 ? '#a3e635' : entry.avg >= 4 ? '#22d3ee' : entry.avg >= 3 ? '#fbbf24' : '#fb7185'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Changes by type + Department hiring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Website Changes by Type</CardTitle>
            <CardDescription>What kind of changes are detected</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={Object.entries(data.changesByType).map(([name, value]) => ({ name, value: value as number }))} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {Object.entries(data.changesByType).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hiring by Department</CardTitle>
            <CardDescription>Where competitors invest headcount</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={Object.entries(data.hiringByDept).map(([name, value]) => ({ department: name, count: value as number }))}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="department" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <PolarRadiusAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <Radar dataKey="count" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Word cloud */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="size-4 text-chart-5" />
            Customer Voice Word Cloud
          </CardTitle>
          <CardDescription>Most common terms in customer reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-2 py-4">
            {data.wordCloud.map((w: any, i: number) => {
              const size = 12 + Math.min(w.value * 4, 24)
              return (
                <span
                  key={i}
                  className="word-cloud-item font-semibold cursor-default"
                  style={{
                    fontSize: `${size}px`,
                    color: COLORS[i % COLORS.length],
                    opacity: 0.6 + Math.min(w.value * 0.1, 0.4),
                  }}
                  title={`${w.value} occurrences`}
                >
                  {w.text}
                </span>
              )
            })}
            {data.wordCloud.length === 0 && (
              <p className="text-xs text-muted-foreground py-8">No review text available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className={`text-xl md:text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}
