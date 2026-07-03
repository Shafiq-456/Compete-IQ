'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import {
  MessageSquare, Send, Sparkles, Bot, User, Trash2, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader } from '@/components/shared/primitives'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { slideInRight, slideInLeft, fadeUp, glowPulse } from '@/lib/animations'
import { useAuth } from '@/components/auth/auth-provider'

// Stage B: Niche-aware suggested prompts (replace generic OpenAI/Anthropic prompts).
// Each niche gets prompts that make sense for that industry.
const NICHE_PROMPTS: Record<string, string[]> = {
  'E-commerce': [
    'Summarize my competitive landscape',
    'Which competitor cut prices this week?',
    'What new products launched recently?',
    'What should my marketing team emphasize vs competitors?',
  ],
  'SaaS': [
    'Summarize my competitive landscape',
    'Which competitor is the biggest threat?',
    'What pricing changes happened this week?',
    'What should my sales team say if a customer mentions a competitor?',
  ],
  'FinTech': [
    'Summarize my competitive landscape',
    'Any regulatory news about my competitors?',
    'Which competitor is expanding fastest?',
    'What are the biggest threats to my business this month?',
  ],
  'Healthcare': [
    'Summarize my competitive landscape',
    'What are customers saying about my competitors?',
    'Any partnerships or FDA news recently?',
    'Which competitor has the strongest product portfolio?',
  ],
  'Real Estate': [
    'Summarize my competitive landscape',
    'Which competitor launched new features?',
    'What are customers complaining about?',
    'What should I watch out for this month?',
  ],
  'Education': [
    'Summarize my competitive landscape',
    'Which competitor has the best reviews?',
    'What new courses or features launched?',
    'How are competitors pricing their plans?',
  ],
  'Marketing': [
    'Summarize my competitive landscape',
    'Which competitor is most active on social?',
    'What new features or products launched?',
    'What should my sales team say if a customer mentions a competitor?',
  ],
  'Food & Beverage': [
    'Summarize my competitive landscape',
    'What are customers saying about my competitors?',
    'Which competitor is most active on social?',
    'What should I watch out for this month?',
  ],
  'Other': [
    'Summarize my competitive landscape',
    'Which competitor is the biggest threat?',
    'What should I watch out for this month?',
    'What should my sales team say if a customer mentions a competitor?',
  ],
}

export function ChatView() {
  const qc = useQueryClient()
  const { state } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null
  const niche = user?.businessNiche || 'Other'
  const [input, setInput] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const welcomeTriggered = React.useRef(false)

  const { data } = useQuery<{ history: any[] }>({
    queryKey: ['chat-history'],
    queryFn: async () => (await fetch('/api/chat')).json(),
  })

  // Stage B: detect first-time users and trigger the personalized AI welcome
  const welcomeMutation = useMutation({
    mutationFn: async () => (await fetch('/api/onboarding/welcome', { method: 'POST' })).json(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-history'] })
      qc.invalidateQueries({ queryKey: ['auth-me'] })
    },
  })

  const history = data?.history ?? []

  // If user is authenticated, has run first scan, but hasn't seen onboarding
  // AND has no chat history yet → trigger welcome
  React.useEffect(() => {
    if (
      user &&
      user.hasRunFirstScan &&
      !user.hasSeenOnboarding &&
      history.length === 0 &&
      !welcomeTriggered.current &&
      !welcomeMutation.isPending
    ) {
      welcomeTriggered.current = true
      welcomeMutation.mutate()
    }
  }, [user, history.length, welcomeMutation])

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) throw new Error('Failed to get AI response')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-history'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history.length, mutation.isPending])

  const send = (msg?: string) => {
    const text = (msg ?? input).trim()
    if (!text || mutation.isPending) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    mutation.mutate(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const suggestedPrompts = NICHE_PROMPTS[niche] || NICHE_PROMPTS['Other']
  const showSuggestions = history.length <= 1

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <PageHeader
          title="AI Chat Assistant"
          description="Ask business questions in natural language — powered by your live competitor data"
          icon={MessageSquare}
        />
      </motion.div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">CompetitorIQ Assistant</CardTitle>
                <CardDescription>
                  Connected to live data{user?.businessNiche ? ` · ${user.businessNiche} niche` : ''}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </CardHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {history.length === 0 && !mutation.isPending && !welcomeMutation.isPending && (
            <div className="text-center py-8">
              <motion.div
                variants={glowPulse}
                initial="hidden"
                animate="show"
                className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center mx-auto mb-3"
              >
                <Sparkles className="size-7 text-primary" />
              </motion.div>
              <p className="text-sm font-medium mb-1">Ask me anything about your competitors</p>
              <p className="text-xs text-muted-foreground mb-4">I have access to your live monitoring data — news, pricing, products, hiring, reviews, and more.</p>
            </div>
          )}

          {welcomeMutation.isPending && history.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Generating your personalized welcome…
                </div>
              </div>
            </div>
          )}

          {history.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}

          {mutation.isPending && (
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Analyzing competitor data…
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stage B: Niche-aware suggested prompts */}
        {showSuggestions && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {suggestedPrompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                disabled={mutation.isPending || welcomeMutation.isPending}
                className="text-[11px] px-2.5 py-1 rounded-full border bg-card hover:bg-muted hover:border-primary/30 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about competitor changes, pricing, products, hiring, strategies…"
              className="min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button onClick={() => send()} disabled={!input.trim() || mutation.isPending} size="icon" className="h-10 w-10 shrink-0">
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Press Enter to send · Shift+Enter for new line · AI has access to your full competitor database
          </p>
        </div>
      </Card>
    </div>
  )
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user'
  return (
    <motion.div
      variants={isUser ? slideInRight : slideInLeft}
      initial="hidden"
      animate="show"
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-muted' : 'bg-primary/10'}`}>
        {isUser ? <User className="size-4 text-muted-foreground" /> : <Bot className="size-4 text-primary" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-semibold mb-1.5 mt-3 text-primary">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-semibold mb-1 mt-2">{children}</h3>,
                p: ({ children }) => <p className="text-sm leading-relaxed mb-2">{children}</p>,
                ul: ({ children }) => <ul className="text-sm space-y-0.5 mb-2 list-disc list-inside">{children}</ul>,
                ol: ({ children }) => <ol className="text-sm space-y-0.5 mb-2 list-decimal list-inside">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => <code className="text-xs bg-background/50 px-1 py-0.5 rounded">{children}</code>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}
