// Stage B: AI Onboarding Welcome endpoint.
// Called once on first visit to the Chat Assistant view.
// Generates (not hardcoded) a personalized welcome message using the user's
// niche + competitors + actual scan totals, then marks hasSeenOnboarding=true
// so the message is only shown once.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateOnboardingWelcome } from '@/lib/ai'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const competitors = await db.competitor.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    })

    // Compute actual scan totals to reference in the welcome
    const [pricingChanges, products, news, jobs, alerts] = await Promise.all([
      db.pricingHistory.count({ where: { competitor: { userId: user.id } } }),
      db.product.count({ where: { competitor: { userId: user.id } } }),
      db.newsArticle.count({ where: { competitor: { userId: user.id } } }),
      db.jobPosting.count({ where: { competitor: { userId: user.id } } }),
      db.alert.count({ where: { competitor: { userId: user.id } } }),
    ])

    const welcome = await generateOnboardingWelcome({
      niche: user.businessNiche || 'Other',
      businessName: user.businessName,
      competitorNames: competitors.map((c) => c.name),
      scanTotals: { pricingChanges, products, newsArticles: news, jobs, alerts },
    })

    // Save the welcome as the first assistant message in chat history
    const saved = await db.chatHistory.create({
      data: {
        user: { connect: { id: user.id } },
        role: 'assistant',
        content: welcome,
        context: JSON.stringify({ type: 'onboarding-welcome', niche: user.businessNiche }),
      },
    })

    // Mark onboarding as seen so this message is only generated once
    await db.user.update({
      where: { id: user.id },
      data: { hasSeenOnboarding: true },
    })

    return NextResponse.json({ message: saved })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
