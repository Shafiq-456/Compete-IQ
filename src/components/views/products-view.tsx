'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, CheckCircle2, Boxes, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, StatusDot, EmptyState } from '@/components/shared/primitives'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, staggerContainerFast, slideInRight, hoverLift } from '@/lib/animations'

export function ProductsView() {
  const [competitorId, setCompetitorId] = React.useState('all')
  const { data } = useQuery<{ products: any[] }>({
    queryKey: ['products', competitorId],
    queryFn: async () => {
      const url = competitorId === 'all' ? '/api/products' : `/api/products?competitorId=${competitorId}`
      const res = await fetch(url)
      return res.json()
    },
  })
  const { data: compData } = useQuery<{ competitors: any[] }>({
    queryKey: ['competitors'],
    queryFn: async () => (await fetch('/api/competitors')).json(),
  })

  const products = data?.products ?? []

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Product Intelligence"
          description="AI agent tracks products, features, integrations, and version history"
          icon={Package}
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
        <StatTile icon={Boxes} label="Total Products" value={products.length} color="text-chart-1" />
        <StatTile icon={CheckCircle2} label="Active" value={products.filter((p) => p.status === 'Active').length} color="text-chart-2" />
        <StatTile icon={Layers} label="Beta" value={products.filter((p) => p.status === 'Beta').length} color="text-chart-3" />
        <StatTile icon={Package} label="Categories" value={new Set(products.map((p) => p.category)).size} color="text-chart-5" />
      </motion.div>

      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products tracked yet" />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
        >
          {products.map((p) => {
            const features: string[] = p.features ? JSON.parse(p.features) : []
            const integrations: string[] = p.integrations ? JSON.parse(p.integrations) : []
            return (
              <motion.div key={p.id} variants={slideInRight} whileHover={hoverLift} className="h-full">
              <Card className="hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                        {p.competitor?.logo || '📦'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">{p.competitor?.name}</p>
                      </div>
                    </div>
                    <StatusDot status={p.status} />
                  </div>

                  {p.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                    {p.version && <Badge variant="secondary" className="text-[10px]">v{p.version}</Badge>}
                  </div>

                  {features.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {features.slice(0, 5).map((f, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {f}
                          </span>
                        ))}
                        {features.length > 5 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            +{features.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {integrations.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Integrations</p>
                      <div className="flex flex-wrap gap-1">
                        {integrations.map((int, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {int}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
