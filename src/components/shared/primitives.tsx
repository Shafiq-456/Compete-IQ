'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle, ArrowUp, ArrowDown, Minus,
  type LucideIcon,
} from 'lucide-react'

export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  const map: Record<string, { variant: 'destructive' | 'default' | 'secondary' | 'outline'; cls: string }> = {
    Critical: { variant: 'destructive', cls: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
    High: { variant: 'default', cls: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
    Medium: { variant: 'secondary', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
    Low: { variant: 'outline', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  }
  const cfg = map[severity] ?? map.Medium
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border', cfg.cls, className)}>
      {severity === 'Critical' && <AlertTriangle className="size-3" />}
      {severity}
    </span>
  )
}

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  const map: Record<string, string> = {
    Positive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    Negative: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    Neutral: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border', map[sentiment] ?? map.Neutral)}>
      {sentiment}
    </span>
  )
}

export function TrendPill({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value === 0) return <Minus className="size-3 text-muted-foreground inline" />
  const up = value > 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'bg-emerald-500',
    Paused: 'bg-amber-500',
    Idle: 'bg-slate-400',
    Error: 'bg-red-500',
    Beta: 'bg-blue-500',
    Deprecated: 'bg-slate-400',
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', map[status] ?? 'bg-slate-400')} />
      <span className="text-xs">{status}</span>
    </span>
  )
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="size-5 text-primary" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function StatTrend({ value, label }: { value: number; label: string }) {
  const up = value >= 0
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className={up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
        {up ? '↑' : '↓'} {Math.abs(value)}%
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

export function timeAgo(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return date.toLocaleDateString()
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
