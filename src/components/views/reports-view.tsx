'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { FileText, Sparkles, Download, Calendar, Clock, FileBarChart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, EmptyState, timeAgo } from '@/components/shared/primitives'
import { toast } from 'sonner'

const REPORT_TYPES = [
  { type: 'Daily', label: 'Daily Report', desc: 'Today\'s competitor activity summary', icon: Clock },
  { type: 'Weekly', label: 'Weekly Report', desc: 'Comprehensive week-in-review with trends', icon: Calendar },
  { type: 'Monthly', label: 'Monthly Report', desc: 'Strategic monthly intelligence digest', icon: FileBarChart },
  { type: 'Executive', label: 'Executive Summary', desc: 'C-suite ready strategic briefing', icon: FileText },
]

export function ReportsView() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<{ reports: any[] }>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports')
      return res.json()
    },
  })
  const [selectedId, setSelectedId] = React.useState<string>('')
  const [reportType, setReportType] = React.useState('Weekly')

  React.useEffect(() => {
    if (!selectedId && data?.reports?.length) setSelectedId(data.reports[0].id)
  }, [data, selectedId])

  const generateMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: type,
          period: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        }),
      })
      if (!res.ok) throw new Error('Failed to generate report')
      return res.json()
    },
    onSuccess: (data) => {
      toast.success('Report generated')
      qc.invalidateQueries({ queryKey: ['reports'] })
      setSelectedId(data.report.id)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const reports = data?.reports ?? []
  const selected = reports.find((r) => r.id === selectedId)

  return (
    <div>
      <PageHeader
        title="AI Report Generator"
        description="Generate daily, weekly, monthly, and executive intelligence reports"
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => generateMutation.mutate({ type: reportType })} disabled={generateMutation.isPending}>
              <Sparkles className="size-4" />
              {generateMutation.isPending ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        }
      />

      {/* Report type cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {REPORT_TYPES.map((t) => (
          <button
            key={t.type}
            onClick={() => { setReportType(t.type); generateMutation.mutate({ type: t.type }) }}
            disabled={generateMutation.isPending}
            className="text-left rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all disabled:opacity-50"
          >
            <t.icon className="size-5 text-primary mb-2" />
            <p className="text-sm font-semibold">{t.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Reports list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Generated Reports</CardTitle>
            <CardDescription>{reports.length} reports available</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-3">
              <div className="space-y-2">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${selectedId === r.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted/40'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{r.reportType}</Badge>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(r.generatedAt)}</span>
                    </div>
                    <p className="text-xs font-medium leading-tight line-clamp-2">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{r.period}</p>
                  </button>
                ))}
                {reports.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No reports yet. Generate one above.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Report viewer */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{selected?.title ?? 'Select a report'}</CardTitle>
              <CardDescription>{selected?.period}</CardDescription>
            </div>
            {selected && (
              <Button variant="outline" size="sm" onClick={() => downloadReport(selected)}>
                <Download className="size-3.5" />
                Export
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selected ? (
              <ScrollArea className="h-[600px] pr-3">
                <article className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-4 text-primary">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-3">{children}</h3>,
                      p: ({ children }) => <p className="text-sm leading-relaxed mb-3 text-foreground/90">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-1 mb-3 list-disc list-inside text-foreground/90">{children}</ul>,
                      ol: ({ children }) => <ol className="text-sm space-y-1 mb-3 list-decimal list-inside text-foreground/90">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    }}
                  >
                    {selected.content}
                  </ReactMarkdown>
                </article>
              </ScrollArea>
            ) : (
              <EmptyState icon={FileText} title="No report selected" description="Generate a new report or pick one from the list." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function downloadReport(report: any) {
  const blob = new Blob([`# ${report.title}\n\nPeriod: ${report.period}\nGenerated: ${new Date(report.generatedAt).toISOString()}\n\n---\n\n${report.content}`], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Report exported as Markdown')
}
