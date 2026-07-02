'use client'

import * as React from 'react'
import {
  LayoutDashboard, BarChart3, BellRing, Globe, Newspaper, Package,
  DollarSign, Users, Share2, Star, Grid3x3, FileText, MessageSquare,
  Bot, Building2, Radar, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_GROUPS, type NavKey } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, BarChart3, BellRing, Globe, Newspaper, Package,
  DollarSign, Users, Share2, Star, Grid3x3, FileText, MessageSquare,
  Bot, Building2,
}

export function Sidebar({
  active,
  onChange,
  alertCount = 0,
  collapsed = false,
  onToggleCollapse,
}: {
  active: NavKey
  onChange: (key: NavKey) => void
  alertCount?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border">
        <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/20">
          <Radar className="size-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">CompetitorIQ</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Intelligence</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ICONS[item.icon] ?? LayoutDashboard
                  const isActive = active === item.key
                  const showBadge = item.key === 'alerts' && alertCount > 0
                  return (
                    <button
                      key={item.key}
                      onClick={() => onChange(item.key)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                        collapsed && 'justify-center'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
                      )}
                      <Icon className={cn('size-4 shrink-0', isActive && 'text-primary')} />
                      {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                      {!collapsed && showBadge && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                          {alertCount}
                        </Badge>
                      )}
                      {collapsed && showBadge && (
                        <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-chart-2/10 p-3 text-xs">
            <p className="font-semibold text-foreground mb-0.5">11 AI agents active</p>
            <p className="text-muted-foreground">Monitoring 8 competitors across 7 channels</p>
            <Button size="sm" variant="ghost" className="mt-2 h-7 w-full text-xs" onClick={onToggleCollapse}>
              Collapse sidebar
            </Button>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="border-t border-sidebar-border p-2">
          <Button size="sm" variant="ghost" className="w-full" onClick={onToggleCollapse}>
            <LayoutDashboard className="size-4" />
          </Button>
        </div>
      )}
    </aside>
  )
}
