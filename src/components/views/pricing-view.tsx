'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, EmptyState } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, staggerContainerFast } from '@/lib/animations'

const COLORS = ['#22d3ee', '#e879f9', '#fbbf24', '#a3e635', '#a78bfa', '#38bdf8', '#fb7185', '#fb923c']

export function PricingView() {
  const [competitorId, setCompetitorId] = React.useState('all')
  const { data } = useQuery<{ pricing: any[] }>({
    queryKey: ['pricing', competitorId],
    queryFn: async () => {
      const url = competitorId === 'all' ? '/api/pricing' : `/api/pricing?competitorId=${competitorId}`
      const res = await fetch(url)
      return res.json()
    },
  })
  const { data: compData } = useQuery<{ competitors: any[] }>({
    queryKey: ['competitors'],
    queryFn: async () => (await fetch('/api/competitors')).json(),
  })

  const pricing = data?.pricing ?? []
  const changes = pricing.filter((p) => p.previousPrice !== null && p.previousPrice !== undefined)
  const reductions = changes.filter((p) => p.price < (p.previousPrice ?? 0))
  const increases = changes.filter((p) => p.price > (p.previousPrice ?? 0))

  // Latest price per competitor per plan (chart data)
  const chartData = pricing
    .filter((p) => p.billingCycle === 'Monthly')
    .map((p) => ({
      name: p.planName,
      price: p.price,
      competitor: p.competitor?.name,
    }))

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Pricing Intelligence"
          description="AI agent tracks subscription pricing, discounts, and plan changes"
          icon={DollarSign}
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
        <StatTile icon={DollarSign} label="Plans Tracked" value={pricing.length} color="text-chart-1" />
        <StatTile icon={TrendingDown} label="Price Reductions" value={reductions.length} color="text-chart-4" />
        <StatTile icon={TrendingUp} label="Price Increases" value={increases.length} color="text-rose-500" />
        <StatTile icon={DollarSign} label="Free Plans" value={pricing.filter((p) => p.price === 0).length} color="text-chart-5" />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Plan Pricing Comparison</CardTitle>
            <CardDescription>Current subscription pricing across competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any) => [`$${value}`, 'Price']}
                />
                <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Price Changes</CardTitle>
            <CardDescription>Detected adjustments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {changes.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No price changes detected</p>}
              {changes.map((p) => {
                const prev = p.previousPrice ?? p.price
                const pct = prev ? ((p.price - prev) / prev) * 100 : 0
                const down = pct < 0
                return (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{p.competitor?.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{p.planName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono">
                        <span className="line-through text-muted-foreground">${prev}</span>{' '}
                        <span className="font-semibold">${p.price}</span>
                      </p>
                      <p className={`text-[10px] font-medium ${down ? 'text-chart-4' : 'text-rose-500'}`}>
                        {down ? '↓' : '↑'} {Math.abs(pct).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Full pricing table */}
      <motion.div variants={fadeUp}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Pricing Plans</CardTitle>
          <CardDescription>Complete pricing catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {pricing.length === 0 ? (
            <EmptyState icon={DollarSign} title="No pricing data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Competitor</th>
                    <th className="py-2 pr-3 font-medium">Plan</th>
                    <th className="py-2 pr-3 font-medium">Tier</th>
                    <th className="py-2 pr-3 font-medium">Billing</th>
                    <th className="py-2 pr-3 font-medium text-right">Price</th>
                    <th className="py-2 pr-3 font-medium text-right">Previous</th>
                    <th className="py-2 font-medium text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.map((p) => {
                    const prev = p.previousPrice
                    const pct = prev ? ((p.price - prev) / prev) * 100 : 0
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span>{p.competitor?.logo}</span>
                            <span className="font-medium">{p.competitor?.name}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-xs">{p.planName}</td>
                        <td className="py-2 pr-3"><Badge variant="outline" className="text-[10px]">{p.tier}</Badge></td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{p.billingCycle}</td>
                        <td className="py-2 pr-3 text-right font-mono">${p.price}</td>
                        <td className="py-2 pr-3 text-right font-mono text-muted-foreground">{prev ? `$${prev}` : '—'}</td>
                        <td className="py-2 text-right">
                          {prev ? (
                            <span className={`text-xs font-medium ${pct < 0 ? 'text-chart-4' : 'text-rose-500'}`}>
                              {pct < 0 ? '↓' : '↑'} {Math.abs(pct).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
