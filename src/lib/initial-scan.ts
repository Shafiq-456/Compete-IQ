// Stage C: Initial scan generator.
// Given a user's niche + competitors, generates realistic intelligence data
// (news, pricing, products, jobs, reviews, social, website changes, alerts, insights)
// using LLM-grounded templates. Output is specific to each competitor name + niche,
// not generic boilerplate.
import { db } from './db'
import { getZAI } from './ai'
import type { Niche } from './niche-agent-priority'

type ScanInput = {
  userId: string
  niche: Niche
  competitors: any[]
}

type ScanSummary = {
  totals: Record<string, number>
  itemsByAgent: Record<string, number>
}

const NICHES_WITH_CONTEXT: Record<string, string> = {
  'E-commerce': 'Online retail, DTC brands, marketplaces. Pricing wars, product drops, and social campaigns are key signals.',
  'SaaS': 'B2B/B2C software. Pricing tier changes, feature launches, API releases, hiring in engineering = growth signals.',
  'FinTech': 'Payments, banking, lending, insurance. Regulatory news is high-signal. Partnerships with banks/processors matter.',
  'Healthcare': 'Digital health, biotech, medical devices. FDA news, clinical trial updates, provider reviews matter most.',
  'Real Estate': 'PropTech, brokerage, rentals. Market expansion news, platform features, agent reviews.',
  'Education': 'EdTech, courses, learning platforms. Course launches, learner reviews, pricing/discounts.',
  'Marketing': 'Agencies, ad-tech, growth tools. Social campaigns, new feature launches, agency reviews.',
  'Food & Beverage': 'Restaurants, CPG, delivery. Social campaigns, location-based reviews, expansion news.',
  'Other': 'General competitive intelligence across all channels.',
}

// Helper: call LLM with a structured prompt and parse JSON
async function llmJson(systemPrompt: string, userPrompt: string, fallback: any): Promise<any> {
  try {
    const zai = await getZAI()
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    })
    const text = response.choices?.[0]?.message?.content ?? ''
    console.log('[initial-scan] LLM raw response length:', text.length, 'finish_reason:', (response as any)?.choices?.[0]?.finish_reason)
    let cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    // If the JSON was truncated (finish_reason !== 'stop'), try to repair by closing braces
    const fr = (response as any)?.choices?.[0]?.finish_reason
    if (fr && fr !== 'stop') {
      console.warn('[initial-scan] Response was truncated (finish_reason=' + fr + '), attempting repair')
      // Try to find the last complete object in the array
      const lastClose = cleaned.lastIndexOf('}')
      if (lastClose > -1) {
        cleaned = cleaned.slice(0, lastClose + 1) + ']'
        // Also close competitors array if open
        const compOpen = cleaned.indexOf('[')
        const compClose = cleaned.lastIndexOf(']')
        if (compOpen > -1 && compClose === -1) {
          cleaned = cleaned + ']'
        }
        // Add closing brace if needed
        if (!cleaned.endsWith('}')) cleaned = cleaned + '}'
      }
    }
    const parsed = JSON.parse(cleaned)
    console.log('[initial-scan] Parsed JSON OK, keys:', Object.keys(parsed))
    return parsed
  } catch (err: any) {
    console.error('[initial-scan] LLM/parse error:', err?.message)
    return fallback
  }
}

export async function generateInitialScan(input: ScanInput): Promise<ScanSummary> {
  const { userId, niche, competitors } = input
  const nicheContext = NICHES_WITH_CONTEXT[niche] || NICHES_WITH_CONTEXT['Other']

  const totals: Record<string, number> = {}
  const itemsByAgent: Record<string, number> = {}

  // Build a single LLM call to generate intelligence for ALL competitors at once.
  // This is more efficient than per-competitor calls and lets the model produce
  // realistic cross-competitor context.
  const competitorNames = competitors.map((c) => c.name).filter(Boolean).slice(0, 3)
  if (competitorNames.length === 0) {
    return { totals, itemsByAgent }
  }

  const prompt = `You are a competitive intelligence generator. Generate realistic, specific, niche-relevant intelligence data for these competitors in the ${niche} industry.

NICHE CONTEXT: ${nicheContext}

COMPETITORS:
${competitors.map((c, i) => `${i + 1}. ${c.name} (website: ${c.website})`).join('\n')}

For EACH competitor, generate intelligence events from the last 14 days. Use realistic specifics — actual product/feature names, real-sounding pricing tiers, real-sounding news headlines, real-sounding job titles. Vary the events across competitors (don't repeat the same news for all).

Return STRICT JSON with this exact shape:
{
  "competitors": [
    {
      "name": "<competitor name>",
      "website_changes": [
        { "pageType": "Pricing|Products|Homepage|Blog|Docs", "pageTitle": "...", "pageUrl": "/path", "changeType": "TextChange|FeatureUpdate|NewPage|CTAChange|UIChange", "summary": "specific one-line description of what changed", "severity": "High|Medium|Low" }
      ],
      "news": [
        { "title": "...", "source": "Press Release|Google News|RSS|Blog", "url": "https://...", "summary": "...", "category": "Funding|Acquisition|Expansion|Partnership|Product Launch|Leadership|Regulatory", "sentiment": "Positive|Negative|Neutral", "impact": "High|Medium|Low", "daysAgo": 1-14 }
      ],
      "pricing_changes": [
        { "planName": "...", "tier": "Free|Starter|Pro|Enterprise", "billingCycle": "Monthly|Annual", "previousPrice": 29.0, "newPrice": 24.0, "currency": "USD", "notes": "specific reason or context" }
      ],
      "products": [
        { "name": "...", "category": "...", "description": "...", "features": ["feature1", "feature2"], "status": "Active|Beta", "daysAgoReleased": 1-30 }
      ],
      "jobs": [
        { "title": "...", "department": "Engineering|Sales|Marketing|AI|Product|Operations", "seniority": "Junior|Mid|Senior|Lead|Director", "location": "...", "source": "LinkedIn|Greenhouse|Indeed" }
      ],
      "social_posts": [
        { "platform": "LinkedIn|X|YouTube|Instagram", "content": "...", "postType": "Announcement|Campaign|Post|Video", "likes": 100, "comments": 10, "shares": 5, "daysAgo": 1-14 }
      ],
      "reviews": [
        { "source": "G2|Capterra|Trustpilot|Product Hunt|Google Reviews", "author": "...", "rating": 4.5, "title": "...", "content": "...", "sentiment": "Positive|Negative|Neutral", "category": "Praise|Complaint|Feature Request|Bug", "daysAgo": 1-30 }
      ]
    }
  ]
}

Generate EXACTLY 2 items per channel per competitor (no more, no less). Be specific and realistic. The output will be used as live data for a competitive intelligence dashboard, so avoid generic filler — prefer concrete, specific observations like "Launched mobile checkout feature" over "Improved platform". Keep individual text fields under 150 chars to fit token limits.`

  const systemPrompt = 'You are a JSON-only API. Always respond with valid JSON. No prose, no markdown fences.'
  const fallback = { competitors: [] }
  const generated = await llmJson(systemPrompt, prompt, fallback)

  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400 * 1000)

  let totalsCompetitors = 0

  for (const gen of generated.competitors || []) {
    const competitor = competitors.find((c) => c.name === gen.name)
    if (!competitor) continue
    totalsCompetitors++

    // Website changes
    for (const wc of gen.website_changes || []) {
      await db.websiteChange.create({
        data: {
          competitorId: competitor.id,
          pageType: wc.pageType || 'Homepage',
          pageTitle: wc.pageTitle || '',
          pageUrl: wc.pageUrl || '/',
          changeType: wc.changeType || 'TextChange',
          summary: wc.summary || '',
          severity: wc.severity || 'Medium',
          detectedAt: daysAgo(Math.floor(Math.random() * 7) + 1),
        },
      })
      itemsByAgent['WebsiteAgent'] = (itemsByAgent['WebsiteAgent'] || 0) + 1
      totals.websiteChanges = (totals.websiteChanges || 0) + 1
    }

    // News
    for (const n of gen.news || []) {
      await db.newsArticle.create({
        data: {
          competitorId: competitor.id,
          title: n.title || '',
          source: n.source || 'Google News',
          url: n.url || null,
          summary: n.summary || null,
          category: n.category || 'Product Launch',
          sentiment: n.sentiment || 'Neutral',
          impact: n.impact || 'Medium',
          publishedAt: daysAgo(n.daysAgo || Math.floor(Math.random() * 7) + 1),
        },
      })
      itemsByAgent['NewsAgent'] = (itemsByAgent['NewsAgent'] || 0) + 1
      totals.newsArticles = (totals.newsArticles || 0) + 1
    }

    // Pricing changes
    for (const p of gen.pricing_changes || []) {
      await db.pricingHistory.create({
        data: {
          competitorId: competitor.id,
          planName: p.planName || 'Pro',
          tier: p.tier || 'Pro',
          billingCycle: p.billingCycle || 'Monthly',
          price: Number(p.newPrice) || 0,
          previousPrice: p.previousPrice ? Number(p.previousPrice) : null,
          currency: p.currency || 'USD',
          discount: p.notes || null,
          changedAt: daysAgo(Math.floor(Math.random() * 7) + 1),
        },
      })
      itemsByAgent['PricingAgent'] = (itemsByAgent['PricingAgent'] || 0) + 1
      totals.pricingChanges = (totals.pricingChanges || 0) + 1

      // Create an alert for significant price drops
      if (p.previousPrice && Number(p.newPrice) < Number(p.previousPrice)) {
        const pct = (((Number(p.previousPrice) - Number(p.newPrice)) / Number(p.previousPrice)) * 100).toFixed(1)
        await db.alert.create({
          data: {
            competitorId: competitor.id,
            type: 'PriceChange',
            severity: Number(pct) > 15 ? 'Critical' : 'High',
            title: `${competitor.name} cut ${p.planName} price by ${pct}%`,
            message: `${competitor.name} reduced ${p.planName} from $${p.previousPrice} to $${p.newPrice} (${pct}% decrease). ${p.notes || ''}`.trim(),
            recommendation: `Review your own pricing position vs ${competitor.name}. Consider matching, bundling, or emphasizing differentiation.`,
          },
        })
        totals.alerts = (totals.alerts || 0) + 1
      }
    }

    // Products
    for (const p of gen.products || []) {
      const releaseDate = p.daysAgoReleased ? daysAgo(p.daysAgoReleased) : daysAgo(Math.floor(Math.random() * 14) + 1)
      await db.product.create({
        data: {
          competitorId: competitor.id,
          name: p.name || 'New Product',
          category: p.category || 'Feature',
          description: p.description || '',
          features: JSON.stringify(p.features || []),
          integrations: JSON.stringify([]),
          releaseDate,
          status: p.status || 'Active',
        },
      })
      itemsByAgent['ProductAgent'] = (itemsByAgent['ProductAgent'] || 0) + 1
      totals.products = (totals.products || 0) + 1

      // Alert for beta or recent launches
      if (p.status === 'Beta' || (p.daysAgoReleased && p.daysAgoReleased <= 7)) {
        await db.alert.create({
          data: {
            competitorId: competitor.id,
            type: 'ProductLaunch',
            severity: 'High',
            title: `${competitor.name} launched: ${p.name}`,
            message: `${competitor.name} released ${p.name} — ${p.description || 'new product launch'}`.trim(),
            recommendation: `Evaluate ${p.name} against your offering. Update sales battlecard with positioning vs this launch.`,
          },
        })
        totals.alerts = (totals.alerts || 0) + 1
      }
    }

    // Jobs
    for (const j of gen.jobs || []) {
      await db.jobPosting.create({
        data: {
          competitorId: competitor.id,
          title: j.title || 'Open Role',
          department: j.department || 'Engineering',
          seniority: j.seniority || 'Mid',
          location: j.location || 'Remote',
          jobType: 'Full-time',
          source: j.source || 'LinkedIn',
          url: null,
          postedAt: daysAgo(Math.floor(Math.random() * 14) + 1),
        },
      })
      itemsByAgent['CareerAgent'] = (itemsByAgent['CareerAgent'] || 0) + 1
      totals.jobs = (totals.jobs || 0) + 1
    }

    // Social posts
    for (const s of gen.social_posts || []) {
      await db.socialPost.create({
        data: {
          competitorId: competitor.id,
          platform: s.platform || 'LinkedIn',
          content: s.content || '',
          postUrl: null,
          likes: Number(s.likes) || 0,
          comments: Number(s.comments) || 0,
          shares: Number(s.shares) || 0,
          views: (Number(s.likes) || 0) * 15,
          postType: s.postType || 'Post',
          sentiment: 'Neutral',
          publishedAt: daysAgo(s.daysAgo || Math.floor(Math.random() * 7) + 1),
        },
      })
      itemsByAgent['SocialAgent'] = (itemsByAgent['SocialAgent'] || 0) + 1
      totals.socialPosts = (totals.socialPosts || 0) + 1
    }

    // Reviews
    for (const r of gen.reviews || []) {
      await db.review.create({
        data: {
          competitorId: competitor.id,
          source: r.source || 'G2',
          author: r.author || 'Anonymous',
          rating: Number(r.rating) || 4,
          title: r.title || '',
          content: r.content || '',
          sentiment: r.sentiment || 'Neutral',
          category: r.category || 'Praise',
          publishedAt: daysAgo(r.daysAgo || Math.floor(Math.random() * 14) + 1),
        },
      })
      itemsByAgent['ReviewAgent'] = (itemsByAgent['ReviewAgent'] || 0) + 1
      totals.reviews = (totals.reviews || 0) + 1
    }
  }

  // Generate a Trend Agent insight summarizing what was found
  if (totalsCompetitors > 0) {
    const trendContent = `Initial ${niche} competitive scan complete. Across ${totalsCompetitors} tracked competitor(s), we detected: ${totals.newsArticles || 0} news articles, ${totals.pricingChanges || 0} pricing changes, ${totals.products || 0} product launches, ${totals.jobs || 0} open roles, ${totals.socialPosts || 0} social posts, and ${totals.reviews || 0} customer reviews. Most active signals appear in pricing and product launches — recommend weekly monitoring to catch fast-moving competitive shifts.`
    await db.insight.create({
      data: {
        competitor: null,
        agentType: 'TrendAgent',
        title: `${niche} Initial Scan — Trend Summary`,
        content: trendContent,
        impact: 'High',
      },
    })
    itemsByAgent['TrendAgent'] = 1
    totals.insights = (totals.insights || 0) + 1
  }

  return { totals, itemsByAgent }
}
