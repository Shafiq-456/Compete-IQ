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

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

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
    <div>
      <PageHeader
        title="Analytics Dashboard"
        description="Cross-competitor charts, trends, and market insights"
        icon={BarChart3}
      />

      {/* Top stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
        <StatTile label="Competitors" value={data.totals.competitors} color="text-emerald-500" />
        <StatTile label="News" value={data.totals.news} color="text-cyan-500" />
        <StatTile label="Changes" value={data.totals.changes} color="text-amber-500" />
        <StatTile label="Jobs" value={data.totals.jobs} color="text-purple-500" />
        <StatTile label="Social" value={data.totals.social} color="text-pink-500" />
        <StatTile label="Reviews" value={data.totals.reviews} color="text-orange-500" />
        <StatTile label="Alerts" value={data.totals.alerts} color="text-red-500" />
      </div>

      {/* Activity timeline */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-emerald-500" />
            14-Day Activity Timeline
          </CardTitle>
          <CardDescription>Daily count of changes, news, and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.timeline} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="a3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="changes" stroke="#10b981" fill="url(#a1)" name="Changes" />
              <Area type="monotone" dataKey="news" stroke="#06b6d4" fill="url(#a2)" name="News" />
              <Area type="monotone" dataKey="alerts" stroke="#f59e0b" fill="url(#a3)" name="Alerts" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grid: news by category, sentiment, alerts by severity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="size-4 text-cyan-500" />
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
              <TrendingUp className="size-4 text-emerald-500" />
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
                    <Cell key={i} fill={name === 'Positive' ? '#10b981' : name === 'Negative' ? '#ef4444' : '#94a3b8'} />
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
              <BarChart3 className="size-4 text-amber-500" />
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
                    <Cell key={i} fill={name === 'Critical' ? '#ef4444' : name === 'High' ? '#f97316' : name === 'Medium' ? '#f59e0b' : '#10b981'} />
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
                    <Cell key={i} fill={entry.avg >= 4.5 ? '#10b981' : entry.avg >= 4 ? '#06b6d4' : entry.avg >= 3 ? '#f59e0b' : '#ef4444'} />
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
                <Radar dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
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
            <Type className="size-4 text-purple-500" />
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
    </div>
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
