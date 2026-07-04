'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Sparkles, Github, ShieldAlert, ArrowRightLeft } from 'lucide-react'

export default function GitHubMockAuthPage() {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalName = name.trim() || 'GitHub Developer'
    const finalEmail = email.trim() || 'github_guest@competeiq.ai'
    
    // Redirect to the callback route with mock parameters
    const callbackUrl = `/api/auth/callback/github?code=mock_code&name=${encodeURIComponent(finalName)}&email=${encodeURIComponent(finalEmail)}`
    router.push(callbackUrl)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/4 size-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 size-96 rounded-full bg-accent/5 blur-3xl" />

      <Card className="w-full max-w-sm border-glass bg-card/60 backdrop-blur-xl glow-primary-hover transition-all relative z-10 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center glow-primary">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <ArrowRightLeft className="size-4 text-muted-foreground" />
            <div className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center">
              <Github className="size-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Authorize CompeteIQ</CardTitle>
          <CardDescription className="text-xs">
            CompeteIQ is requesting permission to access your GitHub account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-xl border border-glass bg-muted/40 space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="size-3.5 text-accent" />
              Demo Mock Mode Active
            </h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Since GITHUB OAuth Client keys are not configured in your .env file, we are running in simulation mode. Type the name and email you want to test with below.
            </p>
          </div>

          <form onSubmit={handleAuthorize} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">GitHub Display Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Shafiq"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background/50 border-glass"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">GitHub Primary Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. shafiq@github.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-glass"
              />
            </div>

            <Button type="submit" className="w-full font-bold glow-primary text-xs py-5 mt-2">
              Authorize CompeteIQ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
