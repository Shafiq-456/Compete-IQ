'use client'

// Stage 1+2: Login / Signup page
// Aurora-themed auth screen with email/password + a "Try demo analyst" shortcut.
import * as React from 'react'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2, Mail, Lock, User as UserIcon, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp, scaleIn } from '@/lib/animations'

export function AuthScreen() {
  const { login, signup } = useAuth()
  const [mode, setMode] = React.useState<'login' | 'signup'>('signup')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signup(email, password, name)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = async () => {
    setError('')
    setLoading(true)
    try {
      // Demo analyst is pre-onboarded so the user lands directly in the app
      await login('analyst@competitoriq.ai', 'demo')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Aurora backdrop is rendered by layout.tsx — this just adds a centered card */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        className="w-full max-w-md relative z-10"
      >
        {/* Brand header */}
        <div className="text-center mb-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 mb-3"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center glow-primary">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">CompetitorIQ</h1>
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Monitor competitors. Detect market changes. Generate insights automatically.
          </p>
        </div>

        <Card className="glass border-primary/20">
          <CardHeader>
            <div className="flex rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'signup' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                Log in
              </button>
            </div>
            <CardTitle className="text-lg mt-3">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {mode === 'signup'
                ? 'Free during the demo — no credit card required.'
                : 'Log in to access your competitor intelligence dashboard.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 mb-4 font-semibold text-xs border-border/80 hover:bg-muted"
              onClick={() => {
                window.location.href = '/api/auth/github'
              }}
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Continue with GitHub
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">or email</span>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name (optional)</Label>
                  <div className="relative">
                    <UserIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Shafiq"
                      className="pl-9"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="pl-9"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {mode === 'signup' ? 'Create account' : 'Log in'}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">or</span>
              </div>
            </div>

            <Button onClick={demoLogin} disabled={loading} variant="outline" className="w-full">
              <Zap className="size-4 text-primary" />
              Try demo as analyst (Shafiq)
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              The demo analyst has 8 pre-seeded competitors with real intelligence data.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
