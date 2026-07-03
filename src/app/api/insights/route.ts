import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateWeeklyInsight } from '@/lib/ai'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ insights: [] })
  const insights = await db.insight.findMany({
    where: { competitor: { userId: user.id } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { competitor: true },
  })
  return NextResponse.json({ insights })
}

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const [competitors, alerts, changes, news] = await Promise.all([
      db.competitor.findMany({ where: { userId: user.id } }),
      db.alert.findMany({ where: { competitor: { userId: user.id } }, orderBy: { createdAt: 'desc' }, take: 10, include: { competitor: true } }),
      db.websiteChange.findMany({ where: { competitor: { userId: user.id } }, orderBy: { detectedAt: 'desc' }, take: 10, include: { competitor: true } }),
      db.newsArticle.findMany({ where: { competitor: { userId: user.id } }, orderBy: { publishedAt: 'desc' }, take: 10, include: { competitor: true } }),
    ])
    const snapshot = [
      `User industry: ${user.businessNiche || 'N/A'}, business: ${user.businessName || 'N/A'}`,
      `Competitors: ${competitors.length}`,
      `Top alerts: ${alerts.map((a) => `${a.competitor?.name}: ${a.title} [${a.severity}]`).join('; ')}`,
      `Recent changes: ${changes.map((c) => `${c.competitor?.name}: ${c.summary}`).join('; ')}`,
      `Recent news: ${news.map((n) => `${n.competitor?.name}: ${n.title}`).join('; ')}`,
    ].join('\n')
    const content = await generateWeeklyInsight(snapshot)
    const insight = await db.insight.create({
      data: {
        agentType: 'TrendAgent',
        title: `Weekly Insight — ${new Date().toLocaleDateString()}`,
        content,
        impact: 'High',
      },
    })
    return NextResponse.json({ insight })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
