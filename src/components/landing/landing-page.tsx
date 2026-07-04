'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, Check, Activity, Shield, Zap,
  TrendingUp, Newspaper, ChevronLeft, ChevronRight,
  Database, Users, HelpCircle
} from 'lucide-react'
import { AuthScreen } from '../auth/auth-screen'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const INTEL_SLIDES = [
  {
    title: 'Website Monitoring',
    desc: 'Instantly catch changes to messaging, CTAs, product features, and layout details.',
    icon: Activity,
    bgColor: 'from-cyan-500/10 to-blue-500/10',
    borderColor: 'border-cyan-500/20',
    pillColor: 'bg-cyan-500/20 text-cyan-400',
    preview: {
      comp: 'Anthropic',
      action: 'Updated Homepage CTA',
      time: '2 hours ago',
      details: 'Changed CTA from "Try Claude" to "Start Building with Claude 3.5 Sonnet — Developer Platform Open".',
      severity: 'Medium'
    }
  },
  {
    title: 'Pricing Intelligence',
    desc: 'Track subscription plans, enterprise pricing models, and sudden discounts.',
    icon: Zap,
    bgColor: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-500/20',
    pillColor: 'bg-amber-500/20 text-amber-400',
    preview: {
      comp: 'Stripe',
      action: 'Pricing Tier Adjustment',
      time: '1 day ago',
      details: 'Reduced standard API fee for high-volume transactions in EU from 1.4% + €0.25 to 1.1% + €0.20.',
      severity: 'High'
    }
  },
  {
    title: 'Product Intelligence',
    desc: 'Get notified of new integrations, product releases, and documentation updates.',
    icon: Database,
    bgColor: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/20',
    pillColor: 'bg-purple-500/20 text-purple-400',
    preview: {
      comp: 'Google DeepMind',
      action: 'Beta Product Launch',
      time: '3 days ago',
      details: 'Released "Gemini Live API" endpoint for real-time speech-to-speech audio streaming.',
      severity: 'High'
    }
  },
  {
    title: 'Social & Review Signals',
    desc: 'Aggregate and analyze customer reviews, G2 rating shifts, and viral social announcements.',
    icon: Users,
    bgColor: 'from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/20',
    pillColor: 'bg-green-500/20 text-green-400',
    preview: {
      comp: 'OpenAI',
      action: 'Sentiment Alert (G2)',
      time: '4 days ago',
      details: 'Average customer rating dropped from 4.8 to 4.4 due to recent API outage complaints.',
      severity: 'Medium'
    }
  }
]

export function LandingPage() {
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const authSectionRef = React.useRef<HTMLDivElement>(null)

  const scrollToAuth = () => {
    authSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const nextSlide = React.useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % INTEL_SLIDES.length)
  }, [])

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + INTEL_SLIDES.length) % INTEL_SLIDES.length)
  }

  // Auto-play slides
  React.useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  const slide = INTEL_SLIDES[currentSlide]
  const IconComponent = slide.icon

  return (
    <div className="min-h-screen text-foreground select-none relative overflow-x-hidden">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center glow-primary">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">CompetitorIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={scrollToAuth} className="text-sm font-medium">
              Log in
            </Button>
            <Button onClick={scrollToAuth} className="text-sm font-medium glow-primary">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Activity className="size-3.5 text-primary animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Automate Market Intelligence</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Track Everything <br />
              <span className="text-gradient">Your Competitors Do.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
              Ditch manual web-surfing. CompetitorIQ orchestrates autonomous AI agents to watch competitor websites, prices, product drops, and hiring signs for you, delivering instant sales battlecards and digests.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button size="lg" onClick={scrollToAuth} className="gap-2 font-semibold text-base py-6 px-8 glow-primary">
                Try Free Now <ArrowRight className="size-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToAuth} className="font-semibold text-base py-6 px-8">
                View Premium Plans
              </Button>
            </div>
          </div>
          <div className="md:col-span-5 relative flex justify-center">
            {/* Visual element simulating crayon.co tracking dashboard */}
            <div className="relative w-full max-w-sm rounded-2xl bg-card/60 backdrop-blur-xl border border-border p-6 shadow-2xl overflow-hidden glow-primary">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-chart-5" />
              <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Intel Feed</span>
                <span className="size-2 rounded-full bg-green-500 animate-ping" />
              </div>
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">Cohere</span>
                    <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">Critical</span>
                  </div>
                  <p className="text-xs font-semibold">Pricing cut on Command R+</p>
                  <p className="text-[10px] text-muted-foreground">Decreased pricing per 1M tokens by 35% to challenge GPT-4o mini.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">OpenAI</span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">Medium</span>
                  </div>
                  <p className="text-xs font-semibold">Careers: Hiring in Paris</p>
                  <p className="text-[10px] text-muted-foreground">Opened 3 new positions for ML Researchers focusing on Audio Translation.</p>
                </div>
                
                <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gradient">AI Agents</span>
                      <span className="text-[9px] bg-primary/25 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold animate-pulse">Scanning Markets</span>
                    </div>
                    <p className="text-xs font-semibold mt-1">Extracting live updates...</p>
                    <p className="text-[10px] text-muted-foreground">Monitoring websites, pricing, and hiring signs.</p>
                  </div>
                  <div className="loader shrink-0">
                    <div className="circle"></div>
                    <div className="circle"></div>
                    <div className="circle"></div>
                    <div className="circle"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE ROTATOR ("SMOOTH SWIPES") */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Full Coverage Platform</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Our 11 specialized AI agents continuously crawl, extract, and categorize competitor updates. Swipe through to preview how we capture insights.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className={`grid md:grid-cols-2 gap-8 items-center p-8 rounded-2xl bg-gradient-to-br border ${slide.borderColor} ${slide.bgColor}`}
              >
                <div className="space-y-4 text-left">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${slide.pillColor}`}>
                    <IconComponent className="size-4" />
                    {slide.title}
                  </div>
                  <h3 className="text-2xl font-bold">{slide.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{slide.desc}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={prevSlide}>
                      <ChevronLeft className="size-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextSlide}>
                      <ChevronRight className="size-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Visual Card Preview */}
                <div className="bg-card border border-border/80 rounded-xl p-5 shadow-lg space-y-3 text-left">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-primary" />
                      <span className="text-xs font-black">{slide.preview.comp}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{slide.preview.time}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{slide.preview.action}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        slide.preview.severity === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>{slide.preview.severity} Severity</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{slide.preview.details}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-6">
              {INTEL_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  className={`size-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Flexible Pricing Plans</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Get started for free or unlock the full capability of CompetitorIQ with a premium package.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* FREE PLAN */}
          <div className="flex flex-col justify-between border border-border bg-card/40 rounded-2xl p-8 hover:border-primary/30 transition-all relative overflow-hidden">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Standard Free</h3>
                <p className="text-xs text-muted-foreground mt-1">For individuals and validation of products</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-xs text-muted-foreground">/forever</span>
              </div>
              <div className="border-t border-border/50 pt-6">
                <ul className="space-y-3 text-sm text-left">
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span>Monitor up to **3 competitors**</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-muted-foreground">
                    <Check className="size-4 text-muted-foreground/50 shrink-0" />
                    <span>Regular daily scans only</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-muted-foreground">
                    <Check className="size-4 text-muted-foreground/50 shrink-0" />
                    <span>Basic dashboard insights</span>
                  </li>
                </ul>
              </div>
            </div>
            <Button variant="outline" onClick={scrollToAuth} className="w-full mt-8 py-5 font-semibold">
              Get Started Free
            </Button>
          </div>

          {/* PREMIUM PLAN */}
          <div className="flex flex-col justify-between border border-primary bg-card/60 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden glow-primary">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-xl">
              Most Popular
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gradient">Pro Premium</h3>
                <p className="text-xs text-muted-foreground mt-1">For professional analysts and growing startups</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gradient">$29</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
              <div className="border-t border-border/50 pt-6">
                <ul className="space-y-3 text-sm text-left">
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span className="font-semibold text-foreground">Monitor up to **10+ competitors**</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span>**Instant force-rescan** triggers</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span>AI-Generated Sales Battlecards</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span>Weekly digest with threat level sorting</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span>Priority AI agent scheduling</span>
                  </li>
                </ul>
              </div>
            </div>
            <Button onClick={scrollToAuth} className="w-full mt-8 py-5 font-semibold glow-primary">
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </section>

      {/* LOGIN & SIGNUP INLINE SECTION */}
      <section ref={authSectionRef} className="py-16 bg-muted/10 border-t border-border relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Access Your Dashboard</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Create your account to start scanning, or log in to manage your tracked competitors.
            </p>
          </div>
          <AuthScreen />
        </div>
      </section>

    </div>
  )
}
