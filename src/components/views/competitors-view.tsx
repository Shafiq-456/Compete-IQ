'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Building2, Globe, MapPin, MoreHorizontal, Pencil, Trash2,
  Pause, Play, ExternalLink, Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader, SeverityBadge, StatusDot } from '@/components/shared/primitives'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { staggerContainer, slideInRight, fadeUp, hoverLift } from '@/lib/animations'
import { UpgradeBanner } from '@/components/shared/upgrade-banner'

type Competitor = {
  id: string; name: string; industry: string; website: string; country: string;
  description?: string | null; priority: string; logo?: string | null; status: string;
  foundedYear?: number | null; employees?: string | null; revenue?: string | null;
}

export function CompetitorsView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Competitor | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Competitor | null>(null)

  const { data, isLoading } = useQuery<{ competitors: Competitor[] }>({
    queryKey: ['competitors'],
    queryFn: async () => {
      const res = await fetch('/api/competitors')
      return res.json()
    },
  })

  const filtered = (data?.competitors ?? []).filter((c) => {
    if (search && !`${c.name} ${c.industry} ${c.country}`.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    return true
  })

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed to create competitor')
      return j
    },
    onSuccess: () => {
      toast.success('Competitor added — monitoring started')
      qc.invalidateQueries({ queryKey: ['competitors'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setDialogOpen(false)
      setEditing(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/competitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Competitor updated')
      qc.invalidateQueries({ queryKey: ['competitors'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setDialogOpen(false)
      setEditing(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/competitors/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Competitor removed')
      qc.invalidateQueries({ queryKey: ['competitors'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteTarget(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Competitor Management"
          description="Add, edit, pause, or remove tracked competitors"
          icon={Building2}
          actions={
            <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
              <Plus className="size-4" />
              Add Competitor
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={fadeUp} className="mt-4">
        <UpgradeBanner />
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, industry, country…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Cards grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
      >
        {filtered.map((c) => (
          <motion.div key={c.id} variants={slideInRight} whileHover={hoverLift} className="h-full">
          <Card className="group hover:shadow-md hover:border-primary/30 transition-all h-full">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="size-11 rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/20 text-lg">
                  <AvatarFallback className="bg-transparent">{c.logo || c.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold truncate">{c.name}</h3>
                    <StatusDot status={c.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.industry}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 -mr-1">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditing(c); setDialogOpen(true) }}>
                      <Pencil className="size-3.5" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateMutation.mutate({ id: c.id, payload: { status: c.status === 'Active' ? 'Paused' : 'Active' } })}>
                      {c.status === 'Active' ? (<><Pause className="size-3.5" /> Pause monitoring</>) : (<><Play className="size-3.5" /> Resume monitoring</>)}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={c.website} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3.5" /> Open website
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(c)}>
                      <Trash2 className="size-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {c.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Globe className="size-3" />
                  <span className="truncate">{new URL(c.website).host}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3" />
                  <span className="truncate">{c.country}</span>
                </div>
                {c.employees && (
                  <div className="text-muted-foreground">👥 {c.employees}</div>
                )}
                {c.revenue && (
                  <div className="text-muted-foreground">💰 {c.revenue}</div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <SeverityBadge severity={c.priority === 'High' ? 'High' : c.priority === 'Medium' ? 'Medium' : 'Low'} />
                {c.foundedYear && (
                  <span className="text-[10px] text-muted-foreground">Founded {c.foundedYear}</span>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No competitors match your filters.
        </div>
      )}

      {/* Add / Edit dialog */}
      <CompetitorDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null) }}
        competitor={editing}
        onSubmit={(payload) => {
          if (editing) updateMutation.mutate({ id: editing.id, payload })
          else createMutation.mutate(payload)
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the competitor and ALL related monitoring data —
              website changes, news, products, pricing history, jobs, reviews, alerts, and SWOT analyses.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

function CompetitorDialog({
  open, onOpenChange, competitor, onSubmit, loading,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  competitor: Competitor | null
  onSubmit: (payload: any) => void
  loading: boolean
}) {
  const [form, setForm] = React.useState<any>({})

  React.useEffect(() => {
    if (open) {
      setForm(competitor ?? { name: '', industry: '', website: '', country: '', description: '', priority: 'Medium', logo: '🏢', employees: '', revenue: '', foundedYear: '' })
    }
  }, [open, competitor])

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const submit = () => {
    if (!form.name || !form.website) {
      toast.error('Name and website are required')
      return
    }
    let website = form.website
    if (!/^https?:\/\//.test(website)) website = `https://${website}`
    try { new URL(website) } catch { toast.error('Invalid website URL'); return }
    onSubmit({ ...form, website, foundedYear: form.foundedYear ? Number(form.foundedYear) : null })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{competitor ? 'Edit Competitor' : 'Add New Competitor'}</DialogTitle>
          <DialogDescription>
            {competitor ? 'Update monitoring configuration' : 'Add a competitor to start AI-powered monitoring'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Company name *</Label>
            <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. OpenAI" />
          </div>
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Input value={form.industry ?? ''} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. AI / LLM Platform" />
          </div>
          <div className="space-y-1.5">
            <Label>Website *</Label>
            <Input value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} placeholder="https://example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={form.country ?? ''} onChange={(e) => set('country', e.target.value)} placeholder="e.g. United States" />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority ?? 'Medium'} onValueChange={(v) => set('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High — monitor hourly</SelectItem>
                <SelectItem value="Medium">Medium — monitor daily</SelectItem>
                <SelectItem value="Low">Low — monitor weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Logo (emoji)</Label>
            <Input value={form.logo ?? ''} onChange={(e) => set('logo', e.target.value)} maxLength={4} className="w-20" />
          </div>
          <div className="space-y-1.5">
            <Label>Founded year</Label>
            <Input type="number" value={form.foundedYear ?? ''} onChange={(e) => set('foundedYear', e.target.value)} placeholder="2015" />
          </div>
          <div className="space-y-1.5">
            <Label>Employees</Label>
            <Input value={form.employees ?? ''} onChange={(e) => set('employees', e.target.value)} placeholder="e.g. 2,000+" />
          </div>
          <div className="space-y-1.5">
            <Label>Revenue</Label>
            <Input value={form.revenue ?? ''} onChange={(e) => set('revenue', e.target.value)} placeholder="e.g. $3.4B" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Brief description of the competitor" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Saving…' : competitor ? 'Save changes' : 'Add & start monitoring'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
