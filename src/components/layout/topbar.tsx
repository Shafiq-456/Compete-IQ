'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Search, Moon, Sun, Menu, BellRing, Radar, ChevronLeft, Inbox, LogOut, Settings, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NICHE_OPTIONS } from '@/lib/niche-agent-priority'
import { toast } from 'sonner'

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
  const { state, logout, refresh } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null
  const [mounted, setMounted] = React.useState(false)
  
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [editName, setEditName] = React.useState('')
  const [editNiche, setEditNiche] = React.useState('')
  const [updating, setUpdating] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (user) {
      setEditName(user.name || '')
      setEditNiche(user.businessNiche || '')
    }
  }, [user, profileOpen])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: editName, businessNiche: editNiche }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed to update profile')
      toast.success('Business profile updated successfully!')
      setProfileOpen(false)
      await refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

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

      {/* Avatar (Clickable to edit profile niche) */}
      <div className="flex items-center gap-2 pl-2 border-l">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setProfileOpen(true)}
          title="Click to edit business name & industry niche"
        >
          <Avatar className="size-8 bg-gradient-to-br from-primary to-chart-2">
            <AvatarFallback className="bg-transparent text-primary-foreground text-xs font-semibold">
              {user?.avatar || (user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden xl:flex flex-col leading-none text-left">
            <span className="text-xs font-medium flex items-center gap-1">
              {user?.name || 'User'}
              <Settings className="size-3 text-muted-foreground/60" />
            </span>
            <span className="text-[10px] text-muted-foreground">{user?.role || 'Admin'}{user?.businessNiche ? ` · ${user.businessNiche}` : ''}</span>
          </div>
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

      {/* Update Business Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md border-glass bg-card/90 backdrop-blur-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold flex items-center gap-1.5">
              <Settings className="size-4 text-primary" />
              Update Business Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prof-name" className="text-xs font-semibold">Business / Display Name</Label>
              <Input
                id="prof-name"
                type="text"
                placeholder="e.g. Shafiq"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="bg-background/50 border-glass text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Industry Niche</Label>
              <Select value={editNiche} onValueChange={setEditNiche}>
                <SelectTrigger className="w-full bg-background/50 border-glass text-xs">
                  <SelectValue placeholder="Select industry niche" />
                </SelectTrigger>
                <SelectContent>
                  {NICHE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.icon} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setProfileOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={updating} className="text-xs">
                {updating ? <><Loader2 className="size-3.5 animate-spin mr-1" /> Saving…</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  )
}

// Re-export for convenience
export { NAV_GROUPS, ICONS, cn, ChevronLeft }
