'use client'

// Stage C: First-run agent progress screen.
// Shown after onboarding completes, while the multi-agent scan runs.
// Renders a live checklist of agents going queued → running → done.
import * as React from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Check, Clock, Bot, ArrowRight, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, fadeUp, scaleIn } from '@/lib/animations'
import { toast } from 'sonner'

type AgentStep = {
  type: string
  name: string
  description: string
  icon: string
  order: number
  status?: 'queued' | 'running' | 'done'
  itemsFound?: number
}

const STEP_DURATION_MS = 900 // time each agent appears to "run" — staggered for visual effect

export function FirstScanScreen() {
  const { refresh } = useAuth()
  const [steps, setSteps] = React.useState<AgentStep[]>([])
  const [scanStarted, setScanStarted] = React.useState(false)
  const [scanComplete, setScanComplete] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch the ordered agent list for this niche
  const { data: agentPlan } = useQuery<{ agents: AgentStep[]; niche: string }>({
    queryKey: ['first-scan-plan'],
    queryFn: async () => (await fetch('/api/onboarding/scan')).json(),
  })

  // Set the initial step state once the plan loads
  React.useEffect(() => {
    if (agentPlan?.agents && steps.length === 0) {
      setSteps(agentPlan.agents.map((a) => ({ ...a, status: 'queued' })))
    }
  }, [agentPlan, steps.length])

  const runScan = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/onboarding/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Scan failed')
      return j
    },
    onSuccess: (data) => {
      // Mark all agents done with the real item counts
      setSteps((prev) =>
        prev.map((s) => {
          const found = (data.agents || []).find((a: any) => a.type === s.type)
          return { ...s, status: 'done', itemsFound: found?.itemsFound ?? 0 }
        })
      )
      setScanComplete(true)
    },
    onError: (e: any) => {
      setError(e.message)
      toast.error(e.message)
    },
  })

  // Begin the scan automatically once steps load
  React.useEffect(() => {
    if (steps.length > 0 && !scanStarted && !scanComplete) {
      setScanStarted(true)
      // Stagger the visual "running" state for each agent — gives the user something
      // impressive to watch while the actual POST runs in the background.
      steps.forEach((_, i) => {
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'running' } : s))
          )
        }, i * STEP_DURATION_MS)
      })
      // Kick off the actual scan (which can take 5-15s for LLM generation) in parallel
      runScan.mutate()
    }
  }, [steps.length, scanStarted, scanComplete])

  const doneCount = steps.filter((s) => s.status === 'done').length
  const runningCount = steps.filter((s) => s.status === 'running').length
  const progress = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0

  const enterApp = async () => {
    await refresh()
  }

  return (
    <div className="min-h-screen overflow-y-auto p-4 md:p-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto relative z-10"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Bot className="size-3.5 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              {agentPlan?.niche ? `${agentPlan.niche} agents` : 'AI Agents'} running
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient mb-2">
            Running your first competitive scan
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Specialized AI agents are scanning your competitors across {steps.length} intelligence channels, tailored to your industry.
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div variants={fadeUp} className="mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {doneCount} of {steps.length} agents complete
              {runningCount > 0 && ` · ${runningCount} running`}
            </span>
            <span className="font-mono font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-chart-5"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </motion.div>

        {/* Agent checklist */}
        <motion.div variants={fadeUp} className="space-y-2">
          {steps.map((step, i) => (
            <AgentRow key={step.type} step={step} delay={i * 0.05} />
          ))}
        </motion.div>

        {/* Error state */}
        {error && (
          <motion.div variants={fadeUp} className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Scan failed</p>
              <p className="text-xs opacity-90">{error}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => runScan.mutate()}>
                Retry scan
              </Button>
            </div>
          </motion.div>
        )}

        {/* Completion state */}
        <AnimatePresence>
          {scanComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5"
            >
              <Card className="glass border-primary/30 glow-primary">
                <CardContent className="p-5 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="size-12 rounded-2xl bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center mx-auto mb-3"
                  >
                    <Check className="size-6 text-primary-foreground" />
                  </motion.div>
                  <h2 className="text-lg font-semibold mb-1">Your dashboard is ready!</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your AI agents have populated your dashboard with real intelligence data.
                    Head in to see what they found.
                  </p>
                  <Button onClick={enterApp} size="lg" className="min-w-[200px]">
                    Enter dashboard <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {runScan.isPending && !scanComplete && (
          <p className="text-center text-[10px] text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
            <Loader2 className="size-3 animate-spin" />
            Generating intelligence data with AI — this takes 5-15 seconds…
          </p>
        )}
      </motion.div>
    </div>
  )
}

function AgentRow({ step, delay }: { step: AgentStep; delay: number }) {
  const status = step.status || 'queued'
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        status === 'done'
          ? 'border-primary/30 bg-primary/5'
          : status === 'running'
          ? 'border-primary/50 bg-card shadow-lg glow-primary'
          : 'border-border bg-card/50'
      }`}
    >
      <div className="text-2xl shrink-0">{step.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{step.name}</span>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{step.description}</p>
        {status === 'done' && step.itemsFound !== undefined && step.itemsFound > 0 && (
          <p className="text-[10px] text-primary mt-0.5">+ {step.itemsFound} items found</p>
        )}
      </div>
      <div className="shrink-0">
        {status === 'queued' && <Clock className="size-4 text-muted-foreground" />}
        {status === 'running' && <Loader2 className="size-4 text-primary animate-spin" />}
        {status === 'done' && <Check className="size-4 text-primary" />}
      </div>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    queued:  { label: 'Queued',  cls: 'bg-muted text-muted-foreground border-border' },
    running: { label: 'Running', cls: 'bg-primary/15 text-primary border-primary/30' },
    done:    { label: 'Done',    cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  }
  const cfg = map[status] || map.queued
  return (
    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
