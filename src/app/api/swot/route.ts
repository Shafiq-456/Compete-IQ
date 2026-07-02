import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSWOT } from '@/lib/ai'

function buildCompetitorSnapshot(name: string, data: any) {
  const lines: string[] = [`COMPETITOR: ${name}`]
  if (data.products?.length) lines.push(`Products: ${data.products.map((p: any) => p.name).join(', ')}`)
  if (data.news?.length) lines.push(`Recent news: ${data.news.slice(0, 5).map((n: any) => `- ${n.title} (${n.category}, ${n.sentiment})`).join('; ')}`)
  if (data.websiteChanges?.length) lines.push(`Website changes: ${data.websiteChanges.slice(0, 5).map((c: any) => `- ${c.changeType} on ${c.pageType}: ${c.summary}`).join('; ')}`)
  if (data.reviews?.length) {
    const avgRating = (data.reviews.reduce((s: number, r: any) => s + r.rating, 0) / data.reviews.length).toFixed(2)
    lines.push(`Avg review rating: ${avgRating} from ${data.reviews.length} reviews`)
    lines.push(`Review themes: ${data.reviews.slice(0, 5).map((r: any) => `${r.category}: ${r.title}`).join('; ')}`)
  }
  if (data.pricing?.length) lines.push(`Pricing plans: ${data.pricing.map((p: any) => `${p.planName} ${p.currency}${p.price}/${p.billingCycle}${p.previousPrice ? ` (was ${p.previousPrice})` : ''}`).join('; ')}`)
  if (data.jobs?.length) {
    const deptCounts: Record<string, number> = {}
    for (const j of data.jobs) deptCounts[j.department] = (deptCounts[j.department] || 0) + 1
    lines.push(`Hiring: ${Object.entries(deptCounts).map(([d, n]) => `${n} ${d}`).join(', ')}`)
  }
  if (data.social?.length) lines.push(`Social: ${data.social.length} recent posts, top engagement ${Math.max(...data.social.map((s: any) => s.likes))} likes`)
  return lines.join('\n')
}

export async function GET(req: NextRequest) {
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const force = req.nextUrl.searchParams.get('force') === 'true'

  if (!competitorId) {
    return NextResponse.json({ error: 'competitorId required' }, { status: 400 })
  }

  // Check cache first
  if (!force) {
    const cached = await db.swotAnalysis.findFirst({
      where: { competitorId },
      orderBy: { generatedAt: 'desc' },
    })
    if (cached) {
      return NextResponse.json({
        swot: {
          ...cached,
          strengths: JSON.parse(cached.strengths),
          weaknesses: JSON.parse(cached.weaknesses),
          opportunities: JSON.parse(cached.opportunities),
          threats: JSON.parse(cached.threats),
        },
        cached: true,
      })
    }
  }

  // Gather data
  const competitor = await db.competitor.findUnique({ where: { id: competitorId } })
  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [products, news, websiteChanges, reviews, pricing, jobs, social] = await Promise.all([
    db.product.findMany({ where: { competitorId } }),
    db.newsArticle.findMany({ where: { competitorId }, orderBy: { publishedAt: 'desc' }, take: 10 }),
    db.websiteChange.findMany({ where: { competitorId }, orderBy: { detectedAt: 'desc' }, take: 10 }),
    db.review.findMany({ where: { competitorId }, take: 20 }),
    db.pricingHistory.findMany({ where: { competitorId } }),
    db.jobPosting.findMany({ where: { competitorId } }),
    db.socialPost.findMany({ where: { competitorId }, orderBy: { publishedAt: 'desc' }, take: 10 }),
  ])

  const snapshot = buildCompetitorSnapshot(competitor.name, { products, news, websiteChanges, reviews, pricing, jobs, social })
  const generated = await generateSWOT(competitor.name, snapshot)

  // Save
  const saved = await db.swotAnalysis.create({
    data: {
      competitorId,
      strengths: JSON.stringify(generated.strengths || []),
      weaknesses: JSON.stringify(generated.weaknesses || []),
      opportunities: JSON.stringify(generated.opportunities || []),
      threats: JSON.stringify(generated.threats || []),
      summary: generated.summary || '',
    },
  })

  return NextResponse.json({
    swot: {
      ...saved,
      strengths: generated.strengths || [],
      weaknesses: generated.weaknesses || [],
      opportunities: generated.opportunities || [],
      threats: generated.threats || [],
    },
    cached: false,
  })
}
