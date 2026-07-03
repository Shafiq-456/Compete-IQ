import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { NICHE_OPTIONS, type Niche } from '@/lib/niche-agent-priority'

// Stage A: Save onboarding (niche + business name + initial competitors)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { businessNiche, businessName, competitors } = await req.json()
    if (!businessNiche) return NextResponse.json({ error: 'businessNiche required' }, { status: 400 })

    const validNiche = NICHE_OPTIONS.find((n) => n.value === businessNiche)?.value
    if (!validNiche) return NextResponse.json({ error: 'Invalid niche' }, { status: 400 })

    // Update user with onboarding info
    await db.user.update({
      where: { id: user.id },
      data: {
        businessNiche: validNiche,
        businessName: businessName || null,
        hasSeenOnboarding: true,
      },
    })

    // Create initial Competitor records from user-entered names
    const createdCompetitors = []
    if (Array.isArray(competitors) && competitors.length > 0) {
      const cleanedNames = competitors
        .map((c: any) => (typeof c === 'string' ? c.trim() : c?.name?.trim()))
        .filter((n: string) => n && n.length > 0)
        .slice(0, 3)
      for (const name of cleanedNames) {
        const comp = await db.competitor.create({
          data: {
            userId: user.id,
            name,
            industry: validNiche,
            website: `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            country: 'Unknown',
            description: `Tracked competitor in the ${validNiche} space (added during onboarding).`,
            priority: 'High',
            threatLevel: 'High',
            logo: '🏢',
            status: 'Active',
          },
        })
        createdCompetitors.push(comp)
      }
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        businessNiche: validNiche,
        businessName: businessName || null,
        hasSeenOnboarding: true,
      },
      competitors: createdCompetitors,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Stage B: Mark that user has seen the AI assistant onboarding message
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const data: any = {}
    if (body.hasSeenOnboarding !== undefined) data.hasSeenOnboarding = !!body.hasSeenOnboarding
    if (body.hasRunFirstScan !== undefined) data.hasRunFirstScan = !!body.hasRunFirstScan
    const updated = await db.user.update({ where: { id: user.id }, data })
    return NextResponse.json({
      user: {
        id: updated.id,
        hasSeenOnboarding: updated.hasSeenOnboarding,
        hasRunFirstScan: updated.hasRunFirstScan,
        businessNiche: updated.businessNiche,
        businessName: updated.businessName,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
