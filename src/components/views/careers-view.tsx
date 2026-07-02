'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Pie, PieChart, Legend,
} from 'recharts'
import { Users, Briefcase, MapPin, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, timeAgo, EmptyState } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, staggerContainerFast } from '@/lib/animations'

const COLORS = ['#22d3ee', '#e879f9', '#fbbf24', '#a3e635', '#a78bfa', '#38bdf8', '#fb7185', '#fb923c']

export function CareersView() {
  const [competitorId, setCompetitorId] = React.useState('all')
  const { data } = useQuery<{ jobs: any[] }>({
    queryKey: ['careers', competitorId],
    queryFn: async () => {
      const url = competitorId === 'all' ? '/api/careers' : `/api/careers?competitorId=${competitorId}`
      const res = await fetch(url)
      return res.json()
    },
  })
  const { data: compData } = useQuery<{ competitors: any[] }>({
    queryKey: ['competitors'],
    queryFn: async () => (await fetch('/api/competitors')).json(),
  })

  const jobs = data?.jobs ?? []

  // Aggregations
  const deptCounts: Record<string, number> = {}
  for (const j of jobs) deptCounts[j.department] = (deptCounts[j.department] || 0) + 1
  const deptChart = Object.entries(deptCounts).map(([name, count]) => ({ name, count }))

  const seniorityCounts: Record<string, number> = {}
  for (const j of jobs) seniorityCounts[j.seniority] = (seniorityCounts[j.seniority] || 0) + 1
  const seniorityPie = Object.entries(seniorityCounts).map(([name, value]) => ({ name, value }))

  const byCompetitor: Record<string, number> = {}
  for (const j of jobs) {
    const name = j.competitor?.name ?? 'Unknown'
    byCompetitor[name] = (byCompetitor[name] || 0) + 1
  }
  const competitorChart = Object.entries(byCompetitor).map(([name, count]) => ({ name, count }))

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Career Intelligence"
          description="AI agent monitors job postings — hiring signals, team expansion, and strategic direction"
          icon={Users}
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
        <StatTile icon={Briefcase} label="Open Positions" value={jobs.length} color="text-chart-1" />
        <StatTile icon={Users} label="AI Roles" value={jobs.filter((j) => j.department === 'AI').length} color="text-chart-2" />
        <StatTile icon={TrendingUp} label="Senior+" value={jobs.filter((j) => ['Senior', 'Lead', 'Director'].includes(j.seniority)).length} color="text-chart-3" />
        <StatTile icon={MapPin} label="Remote" value={jobs.filter((j) => j.jobType === 'Remote' || j.location?.includes('Remote')).length} color="text-chart-5" />
      </motion.div>

      {/* Charts */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open Roles by Competitor</CardTitle>
            <CardDescription>Headcount investment signals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={competitorChart} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {competitorChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Seniority</CardTitle>
            <CardDescription>Experience-level mix</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={seniorityPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 10 }}>
                  {seniorityPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Department summary */}
      <motion.div variants={fadeUp} className="mb-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">By Department</CardTitle>
          <CardDescription>Where competitors are investing headcount</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2"
          >
            {Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([dept, count], i) => (
              <motion.div key={dept} variants={fadeUp} className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>{count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{dept}</p>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Jobs list */}
      <motion.div variants={fadeUp}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Job Postings</CardTitle>
          <CardDescription>Latest detected openings</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <EmptyState icon={Users} title="No job postings detected" />
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
              {jobs.map((j) => (
                <div key={j.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/40 transition-colors">
                  <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                    {j.competitor?.logo || '👥'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{j.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{j.competitor?.name}</span>
                      <Badge variant="outline" className="text-[10px] py-0">{j.department}</Badge>
                      <Badge variant="secondary" className="text-[10px] py-0">{j.seniority}</Badge>
                      <span className="text-[10px] text-muted-foreground">{j.location}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="ghost" className="text-[10px]">{j.source}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(j.postedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  )
}

function StatTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className={`size-5 ${color}`} />
        <div>
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
