import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ totals: { competitors: 0, news: 0, changes: 0, jobs: 0, social: 0, reviews: 0, alerts: 0 } })
  const [competitors, news, changes, pricing, jobs, social, reviews, alerts] = await Promise.all([
    db.competitor.findMany({ where: { userId: user.id } }),
    db.newsArticle.findMany({ where: { competitor: { userId: user.id } }, include: { competitor: true } }),
    db.websiteChange.findMany({ where: { competitor: { userId: user.id } }, include: { competitor: true } }),
    db.pricingHistory.findMany({ where: { competitor: { userId: user.id } }, include: { competitor: true } }),
    db.jobPosting.findMany({ where: { competitor: { userId: user.id } }, include: { competitor: true } }),
    db.socialPost.findMany({ where: { competitor: { userId: user.id } }, include: { competitor: true } }),
    db.review.findMany({ where: { competitor: { userId: user.id } }, include: { competitor: true } }),
    db.alert.findMany({ where: { competitor: { userId: user.id } }, include: { competitor: true } }),
  ])

  // News by category
  const newsByCategory: Record<string, number> = {}
  for (const n of news) newsByCategory[n.category] = (newsByCategory[n.category] || 0) + 1

  // News by competitor
  const newsByCompetitor = competitors.map((c) => ({
    name: c.name,
    count: news.filter((n) => n.competitorId === c.id).length,
  }))

  // Changes by type
  const changesByType: Record<string, number> = {}
  for (const c of changes) changesByType[c.changeType] = (changesByType[c.changeType] || 0) + 1

  // Hiring by department
  const hiringByDept: Record<string, number> = {}
  for (const j of jobs) hiringByDept[j.department] = (hiringByDept[j.department] || 0) + 1

  // Hiring by competitor
  const hiringByCompetitor = competitors.map((c) => ({
    name: c.name,
    count: jobs.filter((j) => j.competitorId === c.id).length,
  }))

  // Reviews sentiment
  const sentimentCounts: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 }
  for (const r of reviews) sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1

  // Avg rating by competitor
  const ratingByCompetitor = competitors.map((c) => {
    const cReviews = reviews.filter((r) => r.competitorId === c.id)
    const avg = cReviews.length ? cReviews.reduce((s, r) => s + r.rating, 0) / cReviews.length : 0
    return { name: c.name, avg: Number(avg.toFixed(2)), count: cReviews.length }
  })

  // Social engagement by competitor (sum of likes)
  const socialByCompetitor = competitors.map((c) => ({
    name: c.name,
    likes: social.filter((s) => s.competitorId === c.id).reduce((sum, s) => sum + s.likes, 0),
    posts: social.filter((s) => s.competitorId === c.id).length,
  }))

  // Alerts by severity
  const alertsBySeverity: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const a of alerts) alertsBySeverity[a.severity] = (alertsBySeverity[a.severity] || 0) + 1

  // Activity timeline (last 14 days)
  const days: { date: string; changes: number; news: number; alerts: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const next = new Date(d)
    next.setDate(d.getDate() + 1)
    days.push({
      date: d.toISOString().slice(5, 10),
      changes: changes.filter((c) => c.detectedAt >= d && c.detectedAt < next).length,
      news: news.filter((n) => n.publishedAt >= d && n.publishedAt < next).length,
      alerts: alerts.filter((a) => a.createdAt >= d && a.createdAt < next).length,
    })
  }

  // Word cloud from review titles + content snippets
  const wordCounts: Record<string, number> = {}
  const stop = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'for', 'with', 'to', 'in', 'on', 'at', 'of', 'this', 'that', 'it', 'be', 'as', 'our', 'we', 'their', 'they', 'them', 'have', 'has', 'had', 'was', 'were', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'do', 'does', 'did', 'done', 'been', 'being', 'from', 'into', 'than', 'then', 'so', 'if', 'by', 'about', 'your', 'you', 'i', 'me', 'my', 'us'])
  for (const r of reviews) {
    const text = `${r.title} ${r.content}`.toLowerCase()
    for (const w of text.split(/[^a-z]+/).filter((x) => x.length > 3 && !stop.has(x))) {
      wordCounts[w] = (wordCounts[w] || 0) + 1
    }
  }
  const wordCloud = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([text, value]) => ({ text, value }))

  return NextResponse.json({
    newsByCategory,
    newsByCompetitor,
    changesByType,
    hiringByDept,
    hiringByCompetitor,
    sentimentCounts,
    ratingByCompetitor,
    socialByCompetitor,
    alertsBySeverity,
    timeline: days,
    wordCloud,
    totals: {
      competitors: competitors.length,
      news: news.length,
      changes: changes.length,
      jobs: jobs.length,
      social: social.length,
      reviews: reviews.length,
      alerts: alerts.length,
    },
  })
}
