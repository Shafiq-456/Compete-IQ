'use client'

// Stage A: Niche selection screen (shown once, immediately after first signup).
import * as React from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { NICHE_OPTIONS, type Niche } from '@/lib/niche-agent-priority'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ArrowRight, Loader2, Plus, X, Building2, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, fadeUp, scaleIn } from '@/lib/animations'
import { toast } from 'sonner'

export function OnboardingScreen() {
  const { state, refresh } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null
  const [niche, setNiche] = React.useState<Niche | null>(null)
  const [businessName, setBusinessName] = React.useState('')
  const [otherNiche, setOtherNiche] = React.useState('')
  const [competitorInput, setCompetitorInput] = React.useState('')
  const [competitors, setCompetitors] = React.useState<string[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  const addCompetitor = () => {
    const trimmed = competitorInput.trim()
    if (!trimmed) return
    if (competitors.length >= 3) {
      toast.warning('You can add up to 3 competitors during onboarding — you can add more later.')
      return
    }
    if (competitors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning('Already added')
      return
    }
    setCompetitors([...competitors, trimmed])
    setCompetitorInput('')
  }

  const removeCompetitor = (c: string) => {
    setCompetitors(competitors.filter((x) => x !== c))
  }

  const submit = async () => {
    if (!niche) {
      toast.error('Please pick an industry')
      return
    }
    if (niche === 'Other' && !otherNiche.trim()) {
      toast.error('Please describe your industry')
      return
    }
    setSubmitting(true)
    try {
      const finalNiche = niche === 'Other' && otherNiche.trim() ? ('Other' as Niche) : niche
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessNiche: finalNiche,
          businessName: businessName.trim() || null,
          competitors,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed to save onboarding')
      toast.success('Onboarding saved — kicking off your first AI scan…')
      await refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto p-4 md:p-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-3xl mx-auto relative z-10"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Welcome to CompetitorIQ</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient mb-2">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! Let's get you set up.
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Tell us about your business so we can tailor your AI agents to monitor the signals that matter most for you.
          </p>
        </motion.div>

        {/* Niche selection */}
        <motion.div variants={fadeUp}>
          <Card className="glass border-primary/20 mb-5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="size-4 text-primary" />
                <h2 className="text-base font-semibold">What industry is your business in?</h2>
                <span className="text-[10px] text-destructive ml-1">*required</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {NICHE_OPTIONS.map((opt) => {
                  const selected = niche === opt.value
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      onClick={() => setNiche(opt.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`text-left p-3 rounded-xl border transition-all relative ${
                        selected
                          ? 'border-primary bg-primary/10 shadow-lg glow-primary'
                          : 'border-border bg-card/50 hover:border-primary/40 hover:bg-card'
                      }`}
                    >
                      <div className="text-2xl mb-1.5">{opt.icon}</div>
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{opt.description}</div>
                      {selected && (
                        <motion.div
                          layoutId="niche-check"
                          className="absolute top-2 right-2 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold"
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
              {niche === 'Other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <Input
                    placeholder="Describe your industry (e.g. Logistics, Gaming, Hospitality…)"
                    value={otherNiche}
                    onChange={(e) => setOtherNiche(e.target.value)}
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Business name + competitors (optional) */}
        <motion.div variants={fadeUp}>
          <Card className="glass border-border mb-5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="size-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">Your business &amp; competitors <span className="text-xs font-normal text-muted-foreground">(optional but recommended)</span></h2>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="bname" className="text-xs">Business / product name</Label>
                  <Input
                    id="bname"
                    placeholder="e.g. Acme Payments"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="comp" className="text-xs">List 1-3 competitors you already know about</Label>
                  <div className="flex gap-2">
                    <Input
                      id="comp"
                      placeholder="e.g. Stripe, Square, Adyen"
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          addCompetitor()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addCompetitor}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <AnimatePresence>
                    {competitors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-wrap gap-1.5 mt-2"
                      >
                        {competitors.map((c) => (
                          <motion.span
                            key={c}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-xs"
                          >
                            {c}
                            <button
                              type="button"
                              onClick={() => removeCompetitor(c)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="size-3" />
                            </button>
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Adding competitors now lets your AI agents start working immediately — no empty dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit */}
        <motion.div variants={fadeUp} className="flex justify-end gap-2">
          <Button onClick={submit} disabled={!niche || submitting} size="lg" className="min-w-[180px]">
            {submitting ? (
              <><Loader2 className="size-4 animate-spin" /> Saving…</>
            ) : (
              <>Start monitoring <ArrowRight className="size-4" /></>
            )}
          </Button>
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          You can change these later in Settings. We'll never share your data.
        </p>
      </motion.div>
    </div>
  )
}
