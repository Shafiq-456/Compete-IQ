import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiChat } from '@/lib/ai'
import { getCurrentUser } from '@/lib/auth'

function buildContext(data: any, niche?: string, businessName?: string) {
  const lines: string[] = []
  if (niche) lines.push(`USER BUSINESS: ${businessName || 'N/A'} (industry: ${niche})`)
  lines.push(`MONITORED COMPETITORS (${data.competitors.length}):`)
  for (const c of data.competitors) {
    lines.push(`- ${c.name} | ${c.industry} | ${c.country} | Priority: ${c.priority} | Threat: ${c.threatLevel} | Status: ${c.status}`)
  }
  lines.push('\nRECENT ALERTS:')
  for (const a of data.alerts.slice(0, 8)) {
    lines.push(`- [${a.severity}] ${a.competitor?.name ?? 'N/A'}: ${a.title} — ${a.message}`)
  }
  lines.push('\nRECENT WEBSITE CHANGES:')
  for (const c of data.changes.slice(0, 10)) {
    lines.push(`- ${c.competitor?.name}: ${c.changeType} on ${c.pageType} — ${c.summary}`)
  }
  lines.push('\nRECENT NEWS:')
  for (const n of data.news.slice(0, 10)) {
    lines.push(`- ${n.competitor?.name}: ${n.title} [${n.category}, ${n.impact} impact]`)
  }
  lines.push('\nPRICING CHANGES:')
  for (const p of data.pricing.slice(0, 10)) {
    if (p.previousPrice) {
      const pct = (((p.price - p.previousPrice) / p.previousPrice) * 100).toFixed(1)
      lines.push(`- ${p.competitor?.name} ${p.planName}: ${p.previousPrice} → ${p.price} (${pct}%)`)
    }
  }
  lines.push('\nHIRING:')
  for (const j of data.jobs.slice(0, 10)) {
    lines.push(`- ${j.competitor?.name}: ${j.title} (${j.department}, ${j.seniority})`)
  }
  lines.push('\nPRODUCTS:')
  for (const p of data.products.slice(0, 12)) {
    lines.push(`- ${p.competitor?.name}: ${p.name} (${p.category}) — features: ${p.features}`)
  }
  return lines.join('\n')
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ history: [] })
  const history = await db.chatHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })
  return NextResponse.json({ history })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { message } = await req.json()
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

    // Save user message
    await db.chatHistory.create({
      data: { user: { connect: { id: user.id } }, role: 'user', content: message },
    })

    // Build context from database (scoped to user)
    const [competitors, alerts, changes, news, pricing, jobs, products] = await Promise.all([
      db.competitor.findMany({ where: { userId: user.id } }),
      db.alert.findMany({ where: { competitor: { userId: user.id } }, orderBy: { createdAt: 'desc' }, take: 15, include: { competitor: true } }),
      db.websiteChange.findMany({ where: { competitor: { userId: user.id } }, orderBy: { detectedAt: 'desc' }, take: 15, include: { competitor: true } }),
      db.newsArticle.findMany({ where: { competitor: { userId: user.id } }, orderBy: { publishedAt: 'desc' }, take: 15, include: { competitor: true } }),
      db.pricingHistory.findMany({ where: { competitor: { userId: user.id }, previousPrice: { not: null } }, include: { competitor: true } }),
      db.jobPosting.findMany({ where: { competitor: { userId: user.id } }, take: 20, include: { competitor: true } }),
      db.product.findMany({ where: { competitor: { userId: user.id } }, include: { competitor: true } }),
    ])

    const context = buildContext({ competitors, alerts, changes, news, pricing, jobs, products }, user.businessNiche || undefined, user.businessName || undefined)
    const reply = await aiChat(message, context)

    // Save assistant message
    await db.chatHistory.create({
      data: { user: { connect: { id: user.id } }, role: 'assistant', content: reply },
    })

    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
