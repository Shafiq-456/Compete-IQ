// Stage D: Weekly Digest endpoint.
// Aggregates the most important changes across all tracked competitors from the
// past 7 days, grouped by category (pricing, product, news, hiring).
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const SEVERITY_RANK: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 }

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ digest: null })

  const since = new Date(Date.now() - 7 * 86400 * 1000)

  const [competitors, news, changes, pricing, jobs, products, alerts, reviews] = await Promise.all([
    db.competitor.findMany({ where: { userId: user.id } }),
    db.newsArticle.findMany({
      where: { competitor: { userId: user.id }, publishedAt: { gte: since } },
      orderBy: { publishedAt: 'desc' },
      include: { competitor: true },
    }),
    db.websiteChange.findMany({
      where: { competitor: { userId: user.id }, detectedAt: { gte: since } },
      orderBy: { detectedAt: 'desc' },
      include: { competitor: true },
    }),
    db.pricingHistory.findMany({
      where: { competitor: { userId: user.id }, changedAt: { gte: since } },
      orderBy: { changedAt: 'desc' },
      include: { competitor: true },
    }),
    db.jobPosting.findMany({
      where: { competitor: { userId: user.id }, postedAt: { gte: since } },
      orderBy: { postedAt: 'desc' },
      include: { competitor: true },
    }),
    db.product.findMany({
      where: { competitor: { userId: user.id }, releaseDate: { gte: since } },
      orderBy: { releaseDate: 'desc' },
      include: { competitor: true },
    }),
    db.alert.findMany({
      where: { competitor: { userId: user.id }, createdAt: { gte: since } },
      orderBy: [
        { severity: 'desc' }, // Stage D: sort by threat level (severity) by default
        { createdAt: 'desc' },
      ],
      include: { competitor: true },
    }),
    db.review.findMany({
      where: { competitor: { userId: user.id }, publishedAt: { gte: since } },
      orderBy: { publishedAt: 'desc' },
      include: { competitor: true },
    }),
  ])

  // Competitors sorted by threat level (Stage D requirement)
  const threatRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 }
  const competitorsByThreat = [...competitors].sort(
    (a, b) => (threatRank[b.threatLevel] || 0) - (threatRank[a.threatLevel] || 0)
  )

  const digest = {
    period: { from: since.toISOString(), to: new Date().toISOString() },
    niche: user.businessNiche,
    businessName: user.businessName,
    totals: {
      competitors: competitors.length,
      news: news.length,
      changes: changes.length,
      pricing: pricing.length,
      jobs: jobs.length,
      products: products.length,
      alerts: alerts.length,
      reviews: reviews.length,
    },
    competitorsByThreat: competitorsByThreat.map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.logo,
      industry: c.industry,
      threatLevel: c.threatLevel,
      status: c.status,
    })),
    highlights: {
      pricing: pricing.slice(0, 10).map((p) => ({
        competitor: p.competitor?.name,
        plan: p.planName,
        change: p.previousPrice ? `${p.previousPrice} → ${p.price}` : `Now ${p.price}`,
        direction: p.previousPrice ? (p.price < p.previousPrice ? 'down' : 'up') : 'new',
        pct: p.previousPrice ? (((p.price - p.previousPrice) / p.previousPrice) * 100).toFixed(1) : null,
        notes: p.discount,
        when: p.changedAt,
      })),
      products: products.slice(0, 10).map((p) => ({
        competitor: p.competitor?.name,
        product: p.name,
        category: p.category,
        status: p.status,
        features: p.features ? JSON.parse(p.features) : [],
        when: p.releaseDate,
      })),
      news: news.slice(0, 12).map((n) => ({
        competitor: n.competitor?.name,
        title: n.title,
        category: n.category,
        sentiment: n.sentiment,
        impact: n.impact,
        source: n.source,
        when: n.publishedAt,
      })),
      hiring: jobs.slice(0, 12).map((j) => ({
        competitor: j.competitor?.name,
        title: j.title,
        department: j.department,
        seniority: j.seniority,
        location: j.location,
        when: j.postedAt,
      })),
      website: changes.slice(0, 10).map((c) => ({
        competitor: c.competitor?.name,
        page: c.pageType,
        changeType: c.changeType,
        summary: c.summary,
        severity: c.severity,
        when: c.detectedAt,
      })),
      reviews: reviews.slice(0, 8).map((r) => ({
        competitor: r.competitor?.name,
        source: r.source,
        rating: r.rating,
        title: r.title,
        sentiment: r.sentiment,
        category: r.category,
        when: r.publishedAt,
      })),
      alerts: alerts.map((a) => ({
        competitor: a.competitor?.name,
        title: a.title,
        severity: a.severity,
        message: a.message,
        recommendation: a.recommendation,
        when: a.createdAt,
      })),
    },
  }

  return NextResponse.json({ digest })
}
