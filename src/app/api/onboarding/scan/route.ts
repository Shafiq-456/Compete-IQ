// Stage C: Niche-aware multi-agent orchestration.
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

    // If user already ran scan and isn't forcing, return early
    if (user.hasRunFirstScan && !force) {
      return NextResponse.json({ ok: true, alreadyRan: true, message: 'First scan already complete' })
    }

    let competitors = await db.competitor.findMany({ where: { userId: user.id } })
    if (competitors.length === 0) {
      // Safety net: auto-create sample competitors based on niche so the scan never fails
      const nicheDefaults: Record<string, string[]> = {
        'E-commerce': ['Amazon', 'Shopify'],
        'SaaS': ['Salesforce', 'HubSpot'],
        'FinTech': ['Stripe', 'Square'],
        'Healthcare': ['Teladoc', 'Amwell'],
        'Real Estate': ['Zillow', 'Redfin'],
        'Education': ['Coursera', 'Udemy'],
        'Marketing': ['HubSpot', 'Mailchimp'],
        'Food & Beverage': ['DoorDash', 'Uber Eats'],
        'Other': ['Competitor A', 'Competitor B'],
      }
      const niche = (user.businessNiche as string) || 'Other'
      const defaults = nicheDefaults[niche] || nicheDefaults['Other']
      for (const name of defaults) {
        await db.competitor.create({
          data: {
            userId: user.id,
            name,
            industry: niche,
            website: `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            country: 'Unknown',
            description: `Auto-added sample competitor in ${niche} (you can edit or remove this later).`,
            priority: 'High',
            threatLevel: 'High',
            logo: '🏢',
            status: 'Active',
          },
        })
      }
      competitors = await db.competitor.findMany({ where: { userId: user.id } })
    }

    const niche = (user.businessNiche as any) || 'Other'
    const agentOrder: AgentType[] = getAgentsForNiche(niche)

    // IDEMPOTENCY: If force=true, delete existing scan data for this user's competitors
    // so we don't create duplicates on retry.
    if (force) {
      console.log(`[scan] Force=true, cleaning up existing data for user ${user.id}`)
      await Promise.all([
        db.websiteChange.deleteMany({ where: { competitor: { userId: user.id } } }),
        db.newsArticle.deleteMany({ where: { competitor: { userId: user.id } } }),
        db.pricingHistory.deleteMany({ where: { competitor: { userId: user.id } } }),
        db.product.deleteMany({ where: { competitor: { userId: user.id } } }),
        db.jobPosting.deleteMany({ where: { competitor: { userId: user.id } } }),
        db.socialPost.deleteMany({ where: { competitor: { userId: user.id } } }),
        db.review.deleteMany({ where: { competitor: { userId: user.id } } }),
        db.alert.deleteMany({ where: { competitor: { userId: user.id } } }),
        db.insight.deleteMany({ where: { competitor: { userId: user.id } } }),
      ])
    }

    // Run the scan (LLM per-competitor with fallback)
    const summary = await generateInitialScan({
      userId: user.id,
      niche,
      competitors,
    })

    // Mark scan as complete
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
    console.error('[scan] FATAL ERROR:', e?.message, e?.stack)
    // ALWAYS return JSON, never let Next.js render an HTML error page
    return NextResponse.json({
      ok: false,
      error: e?.message || 'Scan failed unexpectedly',
      details: process.env.NODE_ENV === 'development' ? e?.stack : undefined,
    }, { status: 500 })
  }
}

// Returns the ordered agent list for the progress UI
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
