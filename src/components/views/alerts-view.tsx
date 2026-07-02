'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BellRing, Check, CheckCheck, AlertTriangle, Filter, CheckCircle2, Circle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, SeverityBadge, timeAgo, EmptyState } from '@/components/shared/primitives'
import { toast } from 'sonner'

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low']

export function AlertsView() {
  const qc = useQueryClient()
  const [severity, setSeverity] = React.useState('all')

  const { data } = useQuery<{ alerts: any[] }>({
    queryKey: ['alerts', severity],
    queryFn: async () => {
      const url = severity === 'all' ? '/api/alerts' : `/api/alerts?severity=${severity}`
      const res = await fetch(url)
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; isRead?: boolean; isResolved?: boolean }) => {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const alerts = data?.alerts ?? []
  const unread = alerts.filter((a) => !a.isRead).length
  const resolved = alerts.filter((a) => a.isResolved).length

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Real-time notifications about important competitor events"
        icon={BellRing}
        actions={
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All severities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><CardContent className="p-3"><p className="text-2xl font-bold text-emerald-500">{alerts.length}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Total Alerts</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-2xl font-bold text-amber-500">{unread}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Unread</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-2xl font-bold text-red-500">{alerts.filter((a) => a.severity === 'Critical' && !a.isResolved).length}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Critical Open</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-2xl font-bold text-cyan-500">{resolved}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Resolved</p></CardContent></Card>
      </div>

      {/* Severity filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSeverity('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${severity === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}
        >
          All ({alerts.length})
        </button>
        {SEVERITIES.map((s) => {
          const count = alerts.filter((a) => a.severity === s).length
          return (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${severity === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}
            >
              {s} ({count})
            </button>
          )
        })}
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon={BellRing} title="No alerts" description="You're all caught up. New competitor events will appear here." />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card
              key={a.id}
              className={`overflow-hidden transition-all ${a.isResolved ? 'opacity-60' : ''} ${!a.isRead ? 'border-l-4 border-l-primary' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                    a.severity === 'Critical' ? 'bg-red-500/15' :
                    a.severity === 'High' ? 'bg-orange-500/15' :
                    a.severity === 'Medium' ? 'bg-amber-500/15' :
                    'bg-emerald-500/15'
                  }`}>
                    <AlertTriangle className={`size-5 ${
                      a.severity === 'Critical' ? 'text-red-500' :
                      a.severity === 'High' ? 'text-orange-500' :
                      a.severity === 'Medium' ? 'text-amber-500' :
                      'text-emerald-500'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <SeverityBadge severity={a.severity} />
                      <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                      {a.competitor && (
                        <span className="text-xs text-muted-foreground">
                          {a.competitor.logo} {a.competitor.name}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(a.createdAt)}</span>
                    </div>
                    <h3 className="text-sm font-semibold">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.message}</p>

                    {a.recommendation && (
                      <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-0.5 flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          AI Recommendation
                        </p>
                        <p className="text-xs text-foreground/90 leading-relaxed">{a.recommendation}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 mt-3">
                      {!a.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => updateMutation.mutate({ id: a.id, isRead: true })}
                        >
                          <Check className="size-3" />
                          Mark read
                        </Button>
                      )}
                      {!a.isResolved ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => updateMutation.mutate({ id: a.id, isResolved: true, isRead: true })}
                        >
                          <CheckCheck className="size-3" />
                          Resolve
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => updateMutation.mutate({ id: a.id, isResolved: false })}
                        >
                          <Circle className="size-3" />
                          Reopen
                        </Button>
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
