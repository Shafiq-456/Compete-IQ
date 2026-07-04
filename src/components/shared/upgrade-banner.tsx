'use client'

import * as React from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Sparkles, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function UpgradeBanner() {
  const { state, refresh } = useAuth()
  const [loading, setLoading] = React.useState(false)

  if (state.status !== 'authenticated' || state.user.plan === 'premium') {
    return null
  }

  const upgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/upgrade', { method: 'POST' })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Upgrade failed')
      toast.success('Successfully upgraded to Pro Premium! Enjoy up to 10+ competitors.')
      await refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-chart-5/10 to-card/50 p-4 shadow-sm mb-5">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 size-24 rounded-full bg-primary/10 blur-xl" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="size-4 text-primary animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1.5">
              Upgrade to Pro Premium <span className="text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.2 rounded-full uppercase tracking-wider">Only $29/mo</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              You are currently on the Free plan (limited to 3 competitors). Unlock monitoring for up to **10+ competitors**, instant scans, and advanced strategic recommendations.
            </p>
          </div>
        </div>
        <Button onClick={upgrade} disabled={loading} size="sm" className="sm:shrink-0 font-semibold shadow-md glow-primary">
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 mr-1" />}
          Upgrade Now
        </Button>
      </div>
    </div>
  )
}
