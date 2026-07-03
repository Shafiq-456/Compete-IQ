import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReport } from '@/lib/ai'
import { getCurrentUser } from '@/lib/auth'

function buildSnapshot(data: any, niche?: string) {
  const lines: string[] = []
  if (niche) lines.push(`USER INDUSTRY: ${niche}`)
  lines.push(`Total competitors monitored: ${data.competitors.length}`)
  for (const c of data.competitors.slice(0, 8)) {
    lines.push(`\n## ${c.name} (${c.industry}, ${c.country})`)
    const cNews = data.news.filter((n: any) => n.competitorId === c.id).slice(0, 3)
    if (cNews.length) lines.push(`Recent news: ${cNews.map((n: any) => `${n.title} [${n.category}]`).join('; ')}`)
    const cChanges = data.changes.filter((ch: any) => ch.competitorId === c.id).slice(0, 3)
    if (cChanges.length) lines.push(`Website changes: ${cChanges.map((ch: any) => `${ch.changeType} - ${ch.summary}`).join('; ')}`)
    const cPricing = data.pricing.filter((p: any) => p.competitorId === c.id && p.previousPrice)
    if (cPricing.length) lines.push(`Price changes: ${cPricing.map((p: any) => `${p.planName}: ${p.previousPrice} → ${p.price}`).join('; ')}`)
    const cJobs = data.jobs.filter((j: any) => j.competitorId === c.id)
    if (cJobs.length) {
      const deptCounts: Record<string, number> = {}
      for (const j of cJobs) deptCounts[j.department] = (deptCounts[j.department] || 0) + 1
      lines.push(`Hiring: ${Object.entries(deptCounts).map(([d, n]) => `${n} ${d}`).join(', ')}`)
    }
  }
  return lines.join('\n')
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ reports: [] })
  const reports = await db.report.findMany({
    where: { userId: user.id },
    orderBy: { generatedAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({ reports })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { reportType, period } = await req.json()
    const [competitors, news, changes, pricing, jobs] = await Promise.all([
      db.competitor.findMany({ where: { userId: user.id } }),
      db.newsArticle.findMany({ where: { competitor: { userId: user.id } }, orderBy: { publishedAt: 'desc' }, take: 30, include: { competitor: true } }),
      db.websiteChange.findMany({ where: { competitor: { userId: user.id } }, orderBy: { detectedAt: 'desc' }, take: 30, include: { competitor: true } }),
      db.pricingHistory.findMany({ where: { competitor: { userId: user.id }, previousPrice: { not: null } }, include: { competitor: true } }),
      db.jobPosting.findMany({ where: { competitor: { userId: user.id } }, include: { competitor: true } }),
    ])

    const snapshot = buildSnapshot({ competitors, news, changes, pricing, jobs }, user.businessNiche || undefined)
    const content = await generateReport({
      reportType: reportType || 'Weekly',
      period: period || new Date().toLocaleDateString(),
      snapshot,
    })

    const report = await db.report.create({
      data: {
        user: { connect: { id: user.id } },
        title: `${reportType || 'Weekly'} Competitor Intelligence Report — ${period || new Date().toLocaleDateString()}`,
        reportType: reportType || 'Weekly',
        period: period || new Date().toLocaleDateString(),
        content,
      },
    })

    return NextResponse.json({ report })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
