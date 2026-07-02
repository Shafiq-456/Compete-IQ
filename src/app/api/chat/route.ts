import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiChat } from '@/lib/ai'

function buildContext(data: any) {
  const lines: string[] = []
  lines.push(`MONITORED COMPETITORS (${data.competitors.length}):`)
  for (const c of data.competitors) {
    lines.push(`- ${c.name} | ${c.industry} | ${c.country} | Priority: ${c.priority} | Status: ${c.status}`)
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
  const history = await db.chatHistory.findMany({ orderBy: { createdAt: 'asc' }, take: 50 })
  return NextResponse.json({ history })
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

    // Save user message
    await db.chatHistory.create({
      data: { userId: 'user_default', role: 'user', content: message },
    })

    // Build context from database
    const [competitors, alerts, changes, news, pricing, jobs, products] = await Promise.all([
      db.competitor.findMany(),
      db.alert.findMany({ orderBy: { createdAt: 'desc' }, take: 15, include: { competitor: true } }),
      db.websiteChange.findMany({ orderBy: { detectedAt: 'desc' }, take: 15, include: { competitor: true } }),
      db.newsArticle.findMany({ orderBy: { publishedAt: 'desc' }, take: 15, include: { competitor: true } }),
      db.pricingHistory.findMany({ where: { previousPrice: { not: null } }, include: { competitor: true } }),
      db.jobPosting.findMany({ take: 20, include: { competitor: true } }),
      db.product.findMany({ include: { competitor: true } }),
    ])

    const context = buildContext({ competitors, alerts, changes, news, pricing, jobs, products })
    const reply = await aiChat(message, context)

    // Save assistant message
    await db.chatHistory.create({
      data: { userId: 'user_default', role: 'assistant', content: reply },
    })

    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
