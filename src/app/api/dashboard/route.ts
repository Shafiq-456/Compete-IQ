import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [
    competitors,
    websiteChanges,
    alerts,
    news,
    pricingChanges,
    products,
    jobPostings,
    socialPosts,
    reviews,
    insights,
  ] = await Promise.all([
    db.competitor.findMany(),
    db.websiteChange.findMany({ orderBy: { detectedAt: 'desc' }, take: 50, include: { competitor: true } }),
    db.alert.findMany({ orderBy: { createdAt: 'desc' }, take: 30, include: { competitor: true } }),
    db.newsArticle.findMany({ orderBy: { publishedAt: 'desc' }, take: 30, include: { competitor: true } }),
    db.pricingHistory.findMany({ where: { previousPrice: { not: null } }, include: { competitor: true } }),
    db.product.findMany({ include: { competitor: true } }),
    db.jobPosting.findMany({ include: { competitor: true } }),
    db.socialPost.findMany({ orderBy: { publishedAt: 'desc' }, take: 20, include: { competitor: true } }),
    db.review.findMany({ orderBy: { publishedAt: 'desc' }, take: 30, include: { competitor: true } }),
    db.insight.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { competitor: true } }),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const changesToday = websiteChanges.filter((c) => c.detectedAt >= today).length
  const criticalAlerts = alerts.filter((a) => a.severity === 'Critical').length

  return NextResponse.json({
    stats: {
      competitors: competitors.length,
      changesToday,
      criticalAlerts,
      newsArticles: news.length,
      priceChanges: pricingChanges.length,
      productLaunches: products.filter((p) => p.status === 'Beta' || new Date(p.releaseDate ?? 0) > new Date(Date.now() - 30 * 86400 * 1000)).length,
      jobPostings: jobPostings.length,
      socialPosts: socialPosts.length,
      reviews: reviews.length,
    },
    competitors,
    recentChanges: websiteChanges.slice(0, 8),
    recentAlerts: alerts.slice(0, 6),
    recentNews: news.slice(0, 6),
    insights,
    pricingChanges,
    products,
    jobPostings,
    socialPosts,
    reviews,
  })
}
