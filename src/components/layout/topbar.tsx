'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Search, Moon, Sun, Menu, BellRing, Radar, ChevronLeft, Inbox, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { NAV_GROUPS, type NavKey } from '@/lib/nav'
import {
  LayoutDashboard, BarChart3, Globe, Newspaper, Package,
  DollarSign, Users, Share2, Star, Grid3x3, FileText, MessageSquare,
  Bot, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'

const ICONS = {
  LayoutDashboard, BarChart3, BellRing, Globe, Newspaper, Package,
  DollarSign, Users, Share2, Star, Grid3x3, FileText, MessageSquare,
  Bot, Building2, Inbox,
}

export function Topbar({
  title,
  subtitle,
  alertCount = 0,
  active,
  onChange,
  onOpenAlerts,
}: {
  title: string
  subtitle?: string
  alertCount?: number
  active: NavKey
  onChange: (k: NavKey) => void
  onOpenAlerts: () => void
}) {
  const { theme, setTheme } = useTheme()
  const { state, logout } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-0">
          <Sidebar active={active} onChange={onChange} alertCount={alertCount} />
        </SheetContent>
      </Sheet>

      {/* Mobile brand */}
      <div className="md:hidden flex items-center gap-2">
        <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
          <Radar className="size-4 text-primary-foreground" />
        </div>
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base md:text-lg font-semibold truncate leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate hidden sm:block">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="hidden lg:flex relative w-72">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search competitors, news, alerts…"
          className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
      >
        {mounted && theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>

      {/* Alerts */}
      <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={onOpenAlerts}>
        <BellRing className="size-4" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </Button>

      {/* Avatar */}
      <div className="flex items-center gap-2 pl-2 border-l">
        <Avatar className="size-8 bg-gradient-to-br from-primary to-chart-2">
          <AvatarFallback className="bg-transparent text-primary-foreground text-xs font-semibold">
            {user?.avatar || (user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="hidden xl:flex flex-col leading-none">
          <span className="text-xs font-medium">{user?.name || 'User'}</span>
          <span className="text-[10px] text-muted-foreground">{user?.role || 'Admin'}{user?.businessNiche ? ` · ${user.businessNiche}` : ''}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 ml-1"
          onClick={() => logout()}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}

// Re-export for convenience
export { NAV_GROUPS, ICONS, cn, ChevronLeft }
