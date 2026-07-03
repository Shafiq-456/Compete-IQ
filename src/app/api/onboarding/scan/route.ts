// Stage C: Niche-aware multi-agent orchestration.
// When called, generates seeded intelligence data for each of the user's competitors
// using LLM-grounded templates specific to their niche. Returns a list of agents
// with their final status (we don't use real background jobs — we simulate the
// "running" timeline on the client by staggering status updates).
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getAgentsForNiche, type AgentType, AGENT_META } from '@/lib/niche-agent-priority'
import { generateInitialScan } from '@/lib/initial-scan'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const force = body?.force === true
    if (user.hasRunFirstScan && !force) {
      return NextResponse.json({ ok: true, alreadyRan: true, message: 'First scan already complete' })
    }

    const competitors = await db.competitor.findMany({ where: { userId: user.id } })
    if (competitors.length === 0) {
      return NextResponse.json({ ok: false, error: 'No competitors to scan — add competitors first.' }, { status: 400 })
    }

    const niche = (user.businessNiche as any) || 'Other'
    const agentOrder: AgentType[] = getAgentsForNiche(niche)

    // Actually generate and persist intelligence data for these competitors
    // using niche-aware LLM-grounded templates.
    const summary = await generateInitialScan({
      userId: user.id,
      niche,
      competitors,
    })

    // Mark the user as having run their first scan
    await db.user.update({
      where: { id: user.id },
      data: { hasRunFirstScan: true },
    })

    return NextResponse.json({
      ok: true,
      alreadyRan: false,
      agents: agentOrder.map((t, i) => ({
        type: t,
        ...AGENT_META[t],
        status: 'done',
        order: i,
        itemsFound: summary.itemsByAgent[t] || 0,
      })),
      totals: summary.totals,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}

// Stage C: returns the ordered agent list + estimated runtime (for the progress UI
// to render before kicking off the actual scan). Used by the client to render the
// checklist while POST runs in parallel.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const niche = (user.businessNiche as any) || 'Other'
  const agentOrder: AgentType[] = getAgentsForNiche(niche)
  return NextResponse.json({
    niche,
    agents: agentOrder.map((t, i) => ({
      type: t,
      ...AGENT_META[t],
      order: i,
    })),
    hasRunFirstScan: user.hasRunFirstScan,
  })
}
