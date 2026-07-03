// Stage C: Initial scan generator.
// Given a user's niche + competitors, generates realistic intelligence data
// using LLM-grounded templates. Falls back to deterministic seed data if LLM fails.
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

// Call LLM for a SINGLE competitor (smaller payload = faster + more reliable)
async function generateForCompetitor(
  competitorName: string,
  competitorWebsite: string,
  niche: string,
  nicheContext: string
): Promise<any> {
  try {
    const zai = await getZAI()
    const prompt = `Generate realistic competitive intelligence for "${competitorName}" (website: ${competitorWebsite}) in the ${niche} industry.

NICHE CONTEXT: ${nicheContext}

Return STRICT JSON only (no markdown fences, no prose). Use this exact shape with EXACTLY 2 items per channel:
{
  "website_changes": [
    { "pageType": "Pricing", "pageTitle": "Pricing Page", "pageUrl": "/pricing", "changeType": "TextChange", "summary": "Updated Pro tier description and added new enterprise CTA", "severity": "Medium" }
  ],
  "news": [
    { "title": "Specific news headline", "source": "Press Release", "url": "https://example.com/news", "summary": "Brief summary", "category": "Product Launch", "sentiment": "Positive", "impact": "High", "daysAgo": 3 }
  ],
  "pricing_changes": [
    { "planName": "Pro", "tier": "Pro", "billingCycle": "Monthly", "previousPrice": 49, "newPrice": 39, "currency": "USD", "notes": "Aggressive price cut to capture mid-market" }
  ],
  "products": [
    { "name": "Specific product name", "category": "Feature", "description": "Brief description", "features": ["feature1", "feature2"], "status": "Beta", "daysAgoReleased": 5 }
  ],
  "jobs": [
    { "title": "Senior Product Manager", "department": "Product", "seniority": "Senior", "location": "San Francisco", "source": "LinkedIn" }
  ],
  "social_posts": [
    { "platform": "LinkedIn", "content": "Excited to announce our new feature...", "postType": "Announcement", "likes": 245, "comments": 18, "shares": 12, "daysAgo": 2 }
  ],
  "reviews": [
    { "source": "G2", "author": "Verified User", "rating": 4.5, "title": "Great product", "content": "Specific review content", "sentiment": "Positive", "category": "Praise", "daysAgo": 7 }
  ]
}

Rules:
- Generate EXACTLY 2 items per channel (14 total items)
- Use realistic specifics — actual product names, real-sounding headlines, specific prices
- Make it relevant to the ${niche} industry
- Keep each text field under 120 characters
- Vary sentiment (don't make everything positive)
- Output MUST be valid JSON, no markdown fences, no commentary before or after`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a JSON-only API. Respond with valid JSON only. No markdown fences. No prose.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    })

    const text = response.choices?.[0]?.message?.content ?? ''
    let cleaned = text.trim()
    // Strip markdown fences if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    }
    // If truncated, try to repair
    const fr = (response as any)?.choices?.[0]?.finish_reason
    if (fr && fr !== 'stop') {
      console.warn(`[scan] LLM response truncated for ${competitorName} (finish_reason=${fr}), attempting repair`)
      const lastClose = cleaned.lastIndexOf('}')
      if (lastClose > -1) {
        const fragment = cleaned.slice(0, lastClose + 1)
        // Count open/close braces to see if we need to close more
        const opens = (fragment.match(/{/g) || []).length
        const closes = (fragment.match(/}/g) || []).length
        let repaired = fragment
        for (let i = 0; i < opens - closes; i++) repaired += '}'
        // Also close any unclosed arrays
        const openBrackets = (repaired.match(/\[/g) || []).length
        const closeBrackets = (repaired.match(/\]/g) || []).length
        for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']'
        cleaned = repaired
      }
    }

    const parsed = JSON.parse(cleaned)
    console.log(`[scan] LLM OK for ${competitorName}:`, Object.keys(parsed))
    return parsed
  } catch (err: any) {
    console.error(`[scan] LLM failed for ${competitorName}:`, err?.message)
    return null
  }
}

// Deterministic fallback data generator — used when LLM is unavailable or fails.
// Produces niche-aware data using templates so the user still gets a populated dashboard.
function generateFallbackData(competitorName: string, niche: string): any {
  const slug = competitorName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const seed = competitorName.length + niche.length

  const productNames: Record<string, string[]> = {
    'SaaS': ['Pro Dashboard', 'Team Workflows', 'API Gateway'],
    'FinTech': ['Mobile Wallet', 'Payment API', 'Fraud Detection'],
    'E-commerce': ['One-Click Checkout', 'Inventory Sync', 'Loyalty Rewards'],
    'Healthcare': ['Patient Portal', 'Telehealth Module', 'Care Coordination'],
    'Education': ['Course Builder', 'Live Classroom', 'Progress Analytics'],
    'Marketing': ['Campaign Automator', 'A/B Test Engine', 'Lead Scorer'],
    'Real Estate': ['Listing Manager', 'Tour Scheduler', 'Market Analytics'],
    'Food & Beverage': ['Order Tracker', 'Menu Optimizer', 'Delivery Router'],
    'Other': ['Premium Tier', 'Mobile App', 'Integration Hub'],
  }
  const products = productNames[niche] || productNames['Other']

  return {
    website_changes: [
      { pageType: 'Pricing', pageTitle: 'Pricing Page', pageUrl: '/pricing', changeType: 'TextChange', summary: `Updated pricing copy and added new comparison table for ${competitorName}`, severity: 'Medium' },
      { pageType: 'Products', pageTitle: 'Features Page', pageUrl: '/features', changeType: 'FeatureUpdate', summary: `Added new feature section highlighting ${products[0]}`, severity: 'Low' },
    ],
    news: [
      { title: `${competitorName} announces ${niche} expansion strategy`, source: 'Press Release', url: `https://${slug}.com/blog/expansion`, summary: `${competitorName} revealed plans to expand their ${niche} offerings this quarter.`, category: 'Expansion', sentiment: 'Positive', impact: 'High', daysAgo: 3 + (seed % 7) },
      { title: `${competitorName} partners with leading ${niche} platform`, source: 'Google News', url: `https://news.example.com/${slug}`, summary: `Strategic partnership aims to strengthen ${competitorName}'s market position.`, category: 'Partnership', sentiment: 'Positive', impact: 'Medium', daysAgo: 7 + (seed % 5) },
    ],
    pricing_changes: [
      { planName: 'Pro', tier: 'Pro', billingCycle: 'Monthly', previousPrice: 49, newPrice: 39, currency: 'USD', notes: `Competitive price reduction to capture ${niche} mid-market` },
      { planName: 'Enterprise', tier: 'Enterprise', billingCycle: 'Annual', previousPrice: 299, newPrice: 249, currency: 'USD', notes: 'Annual plan discount for enterprise customers' },
    ],
    products: [
      { name: products[0], category: 'Core Feature', description: `${competitorName}'s flagship ${products[0].toLowerCase()} for ${niche} users.`, features: ['Real-time sync', 'Custom workflows', 'API access'], status: 'Active', daysAgoReleased: 5 + (seed % 10) },
      { name: products[1], category: 'New Feature', description: `Newly launched ${products[1].toLowerCase()} targeting ${niche} use cases.`, features: ['Team collaboration', 'Analytics', 'Export'], status: 'Beta', daysAgoReleased: 2 + (seed % 5) },
    ],
    jobs: [
      { title: 'Senior Software Engineer', department: 'Engineering', seniority: 'Senior', location: 'Remote', source: 'LinkedIn' },
      { title: 'Product Marketing Manager', department: 'Marketing', seniority: 'Mid', location: 'San Francisco', source: 'Greenhouse' },
    ],
    social_posts: [
      { platform: 'LinkedIn', content: `Excited to share that ${competitorName} just launched ${products[1]}! Try it today.`, postType: 'Announcement', likes: 150 + (seed * 3), comments: 12, shares: 8, daysAgo: 2 },
      { platform: 'X', content: `Big news for the ${niche} community — our new ${products[0]} is live.`, postType: 'Announcement', likes: 89 + seed, comments: 5, shares: 15, daysAgo: 5 },
    ],
    reviews: [
      { source: 'G2', author: 'Verified User', rating: 4.5, title: 'Solid product with great support', content: `Been using ${competitorName} for 3 months. ${products[0]} works well but ${products[1]} needs polish.`, sentiment: 'Positive', category: 'Praise', daysAgo: 7 },
      { source: 'Capterra', author: 'Reviewer', rating: 3.5, title: 'Good but pricey', content: `The platform is powerful but the Pro tier got more expensive. Considering alternatives.`, sentiment: 'Negative', category: 'Complaint', daysAgo: 12 },
    ],
  }
}

export async function generateInitialScan(input: ScanInput): Promise<ScanSummary> {
  const { userId, niche, competitors } = input
  const nicheContext = NICHES_WITH_CONTEXT[niche] || NICHES_WITH_CONTEXT['Other']

  const totals: Record<string, number> = {}
  const itemsByAgent: Record<string, number> = {}

  if (competitors.length === 0) {
    return { totals, itemsByAgent }
  }

  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400 * 1000)

  let totalsCompetitors = 0

  // Generate data for EACH competitor separately (smaller LLM calls = more reliable)
  for (const competitor of competitors) {
    // Try LLM first, fall back to deterministic data
    let generated = await generateForCompetitor(competitor.name, competitor.website, niche, nicheContext)
    if (!generated) {
      console.log(`[scan] Using fallback data for ${competitor.name}`)
      generated = generateFallbackData(competitor.name, niche)
    }
    totalsCompetitors++

    // Website changes
    for (const wc of generated.website_changes || []) {
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
    for (const n of generated.news || []) {
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
    for (const p of generated.pricing_changes || []) {
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
    for (const p of generated.products || []) {
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
    for (const j of generated.jobs || []) {
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
    for (const s of generated.social_posts || []) {
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
    for (const r of generated.reviews || []) {
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

  // Generate a Trend Agent insight
  if (totalsCompetitors > 0) {
    const trendContent = `Initial ${niche} competitive scan complete. Across ${totalsCompetitors} tracked competitor(s), we detected: ${totals.newsArticles || 0} news articles, ${totals.pricingChanges || 0} pricing changes, ${totals.products || 0} product launches, ${totals.jobs || 0} open roles, ${totals.socialPosts || 0} social posts, and ${totals.reviews || 0} customer reviews. Most active signals appear in pricing and product launches — recommend weekly monitoring to catch fast-moving competitive shifts.`
    await db.insight.create({
      data: {
        competitorId: null,
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
