/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from '../src/lib/db'

const COMPETITORS = [
  {
    id: 'comp_openai',
    name: 'OpenAI',
    industry: 'AI / LLM Platform',
    website: 'https://openai.com',
    country: 'United States',
    description: 'Creator of ChatGPT, GPT-4, and DALL·E. Pioneering research lab turned commercial AI platform.',
    priority: 'High',
    logo: '🟢',
    status: 'Active',
    foundedYear: 2015,
    employees: '2,000+',
    revenue: '$3.4B (est. 2024)',
    socialLinks: JSON.stringify({ twitter: '@openai', linkedin: 'openai', youtube: '@OpenAI' }),
    productCatalog: JSON.stringify(['ChatGPT', 'GPT-4 API', 'DALL·E', 'Sora', 'Whisper']),
  },
  {
    id: 'comp_anthropic',
    name: 'Anthropic',
    industry: 'AI Safety & LLM',
    website: 'https://anthropic.com',
    country: 'United States',
    description: 'AI safety company behind the Claude family of large language models.',
    priority: 'High',
    logo: '🟣',
    status: 'Active',
    foundedYear: 2021,
    employees: '700+',
    revenue: '$1B (est. 2024)',
    socialLinks: JSON.stringify({ twitter: '@AnthropicAI', linkedin: 'anthropic' }),
    productCatalog: JSON.stringify(['Claude 3.5 Sonnet', 'Claude API', 'Claude Enterprise', 'Constitutional AI']),
  },
  {
    id: 'comp_google_deepmind',
    name: 'Google DeepMind',
    industry: 'AI Research & Cloud',
    website: 'https://deepmind.google',
    country: 'United Kingdom',
    description: 'Alphabet subsidiary focused on AI research; developer of Gemini and AlphaFold.',
    priority: 'High',
    logo: '🔵',
    status: 'Active',
    foundedYear: 2010,
    employees: '2,500+',
    revenue: 'Part of Alphabet',
    socialLinks: JSON.stringify({ twitter: '@GoogleDeepMind', linkedin: 'deepmind' }),
    productCatalog: JSON.stringify(['Gemini 1.5 Pro', 'Gemini API', 'AlphaFold', 'Vertex AI']),
  },
  {
    id: 'comp_mistral',
    name: 'Mistral AI',
    industry: 'Open-Source LLM',
    website: 'https://mistral.ai',
    country: 'France',
    description: 'European open-weight LLM lab building competitive alternatives to US-based frontier models.',
    priority: 'Medium',
    logo: '🟠',
    status: 'Active',
    foundedYear: 2023,
    employees: '150+',
    revenue: '$100M (est. 2024)',
    socialLinks: JSON.stringify({ twitter: '@MistralAI', linkedin: 'mistralai' }),
    productCatalog: JSON.stringify(['Mistral Large 2', 'Mixtral 8x22B', 'La Plateforme', 'Le Chat']),
  },
  {
    id: 'comp_meta_ai',
    name: 'Meta AI',
    industry: 'Open-Source AI',
    website: 'https://ai.meta.com',
    country: 'United States',
    description: 'Meta\'s AI division, developer of Llama open-weight models and SAM.',
    priority: 'High',
    logo: '🔵',
    status: 'Active',
    foundedYear: 2013,
    employees: '5,000+',
    revenue: 'Part of Meta',
    socialLinks: JSON.stringify({ twitter: '@AIatMeta', linkedin: 'meta' }),
    productCatalog: JSON.stringify(['Llama 3.1', 'Code Llama', 'SAM 2', 'Llama Stack']),
  },
  {
    id: 'comp_cohere',
    name: 'Cohere',
    industry: 'Enterprise LLM',
    website: 'https://cohere.com',
    country: 'Canada',
    description: 'Enterprise-focused LLM provider specializing in retrieval-augmented generation.',
    priority: 'Medium',
    logo: '🟣',
    status: 'Active',
    foundedYear: 2019,
    employees: '400+',
    revenue: '$200M (est. 2024)',
    socialLinks: JSON.stringify({ twitter: '@cohere', linkedin: 'cohere-ai' }),
    productCatalog: JSON.stringify(['Command R+', 'Embed', 'Rerank', 'Coral']),
  },
  {
    id: 'comp_perplexity',
    name: 'Perplexity AI',
    industry: 'AI Search',
    website: 'https://perplexity.ai',
    country: 'United States',
    description: 'Answer-engine startup combining LLMs with real-time web retrieval.',
    priority: 'Medium',
    logo: '🟢',
    status: 'Active',
    foundedYear: 2022,
    employees: '150+',
    revenue: '$80M (est. 2024)',
    socialLinks: JSON.stringify({ twitter: '@peraboratory', linkedin: 'perplexity-ai' }),
    productCatalog: JSON.stringify(['Perplexity Pro', 'Perplexity Enterprise', 'Sonar API', 'Perplexity Labs']),
  },
  {
    id: 'comp_stability',
    name: 'Stability AI',
    industry: 'Generative Media',
    website: 'https://stability.ai',
    country: 'United Kingdom',
    description: 'Open generative media lab behind Stable Diffusion.',
    priority: 'Low',
    logo: '🟡',
    status: 'Paused',
    foundedYear: 2020,
    employees: '200+',
    revenue: '$50M (est. 2024)',
    socialLinks: JSON.stringify({ twitter: '@StabilityAI', linkedin: 'stability-ai' }),
    productCatalog: JSON.stringify(['Stable Diffusion 3', 'Stable Video', 'Stable Audio']),
  },
]

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
function hoursAgo(n: number) {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d
}

async function seed() {
  console.log('🌱 Seeding CompetitorIQ database…')

  // Reset
  await db.websiteChange.deleteMany()
  await db.product.deleteMany()
  await db.pricingHistory.deleteMany()
  await db.newsArticle.deleteMany()
  await db.socialPost.deleteMany()
  await db.jobPosting.deleteMany()
  await db.review.deleteMany()
  await db.swotAnalysis.deleteMany()
  await db.insight.deleteMany()
  await db.alert.deleteMany()
  await db.report.deleteMany()
  await db.chatHistory.deleteMany()
  await db.agent.deleteMany()
  await db.competitor.deleteMany()
  await db.user.deleteMany()

  // Demo user (pre-onboarded so the app shows real data out of the box)
  await db.user.create({
    data: {
      id: 'user_default',
      email: 'analyst@competitoriq.ai',
      name: 'Jordan Avery',
      role: 'Admin',
      company: 'CompetitorIQ',
      avatar: 'JA',
      businessNiche: 'SaaS',
      businessName: 'CompetitorIQ',
      hasSeenOnboarding: true,
      hasRunFirstScan: true,
    },
  })

  // Competitors (scoped to demo user)
  for (const c of COMPETITORS) {
    const threatLevel = c.priority === 'High' ? 'High' : c.priority === 'Medium' ? 'Medium' : 'Low'
    await db.competitor.create({ data: { ...c, userId: 'user_default', threatLevel } as any })
  }

  // Agents
  const agents = [
    { name: 'Website Agent', type: 'WebsiteAgent', description: 'Detects changes in competitor websites — pages, CTAs, UI, content.', interval: 'hourly', itemsProcessed: 1247, successRate: 98.4 },
    { name: 'News Agent', type: 'NewsAgent', description: 'Aggregates news from Google News, RSS, press releases; classifies & summarizes.', interval: 'hourly', itemsProcessed: 3421, successRate: 99.1 },
    { name: 'Pricing Agent', type: 'PricingAgent', description: 'Tracks subscription pricing, discounts, and enterprise tiers.', interval: 'daily', itemsProcessed: 562, successRate: 100.0 },
    { name: 'Product Agent', type: 'ProductAgent', description: 'Monitors product launches, features, integrations, API releases.', interval: 'daily', itemsProcessed: 894, successRate: 97.8 },
    { name: 'Review Agent', type: 'ReviewAgent', description: 'Collects and analyzes customer reviews across G2, Capterra, Trustpilot.', interval: 'daily', itemsProcessed: 2103, successRate: 96.5 },
    { name: 'Career Agent', type: 'CareerAgent', description: 'Tracks job postings on LinkedIn, Greenhouse, Indeed, careers pages.', interval: 'daily', itemsProcessed: 1547, successRate: 99.3 },
    { name: 'Social Agent', type: 'SocialAgent', description: 'Monitors LinkedIn, X, YouTube, Instagram posts & engagement.', interval: 'hourly', itemsProcessed: 4892, successRate: 98.9 },
    { name: 'Trend Agent', type: 'TrendAgent', description: 'Identifies emerging market trends across all monitored data.', interval: 'weekly', itemsProcessed: 312, successRate: 95.2 },
    { name: 'SWOT Agent', type: 'SWOTAgent', description: 'Generates SWOT analyses from monitoring data on-demand.', interval: 'weekly', itemsProcessed: 87, successRate: 100.0 },
    { name: 'Report Agent', type: 'ReportAgent', description: 'Compiles daily, weekly, and executive reports.', interval: 'daily', itemsProcessed: 145, successRate: 100.0 },
    { name: 'Recommendation Agent', type: 'RecommendationAgent', description: 'Suggests strategic actions for alerts and major events.', interval: 'hourly', itemsProcessed: 678, successRate: 99.7 },
  ]
  for (const a of agents) {
    await db.agent.create({
      data: { ...a, status: 'Active', lastRun: hoursAgo(Math.floor(Math.random() * 4) + 1) },
    })
  }

  // Website changes
  const websiteChanges = [
    { competitorId: 'comp_openai', pageType: 'Products', pageTitle: 'ChatGPT Enterprise Features', pageUrl: 'https://openai.com/enterprise', changeType: 'FeatureUpdate', beforeContent: 'AI Chatbot, Team Workspaces', afterContent: 'AI Chatbot, Team Workspaces, Voice AI, SSO', summary: 'Voice AI feature launched for Enterprise tier.', severity: 'High' },
    { competitorId: 'comp_openai', pageType: 'Pricing', pageTitle: 'ChatGPT Plans', pageUrl: 'https://openai.com/pricing', changeType: 'CTAChange', beforeContent: 'Try ChatGPT Plus', afterContent: 'Start free with ChatGPT Plus', summary: 'CTA changed to lower-friction wording.', severity: 'Medium' },
    { competitorId: 'comp_anthropic', pageType: 'Homepage', pageTitle: 'Anthropic Landing', pageUrl: 'https://anthropic.com', changeType: 'UIChange', beforeContent: 'Minimal hero with logo', afterContent: 'Added product demo video carousel', summary: 'New demo carousel highlights Claude use cases.', severity: 'Medium' },
    { competitorId: 'comp_anthropic', pageType: 'Products', pageTitle: 'Claude 3.5 Sonnet Page', pageUrl: 'https://anthropic.com/claude', changeType: 'FeatureUpdate', beforeContent: '200K context window', afterContent: '200K context window, Computer Use API beta', summary: 'Computer Use API announced.', severity: 'Critical' },
    { competitorId: 'comp_google_deepmind', pageType: 'Blog', pageTitle: 'Gemini 1.5 Flash Announcement', pageUrl: 'https://deepmind.google/blog', changeType: 'NewPage', beforeContent: null, afterContent: 'Gemini 1.5 Flash model — faster, lighter multimodal', summary: 'New lightweight Flash model announced.', severity: 'High' },
    { competitorId: 'comp_mistral', pageType: 'Pricing', pageTitle: 'La Plateforme Pricing', pageUrl: 'https://mistral.ai/pricing', changeType: 'TextChange', beforeContent: 'Mixtral 8x22B: $1.20/M tokens', afterContent: 'Mixtral 8x22B: $0.90/M tokens', summary: '25% price reduction on flagship model.', severity: 'High' },
    { competitorId: 'comp_meta_ai', pageType: 'Products', pageTitle: 'Llama 3.1 Page', pageUrl: 'https://ai.meta.com/llama', changeType: 'FeatureUpdate', beforeContent: 'Llama 3 — 8B, 70B', afterContent: 'Llama 3.1 — 8B, 70B, 405B (new)', summary: 'New 405B frontier model released.', severity: 'Critical' },
    { competitorId: 'comp_perplexity', pageType: 'Homepage', pageTitle: 'Perplexity Home', pageUrl: 'https://perplexity.ai', changeType: 'UIChange', beforeContent: 'Search-focused hero', afterContent: 'Added "Perplexity Labs" section', summary: 'New Labs feature highlighted on homepage.', severity: 'Medium' },
    { competitorId: 'comp_cohere', pageType: 'Docs', pageTitle: 'Command R+ Documentation', pageUrl: 'https://docs.cohere.com', changeType: 'NewPage', beforeContent: null, afterContent: 'Tool use & function calling docs', summary: 'New tool-use documentation published.', severity: 'Low' },
    { competitorId: 'comp_stability', pageType: 'Careers', pageTitle: 'Open Positions', pageUrl: 'https://stability.ai/careers', changeType: 'RemovedPage', beforeContent: '15 open roles', afterContent: '8 open roles', summary: 'Reduced open positions by ~47%.', severity: 'Medium' },
  ]
  for (let i = 0; i < websiteChanges.length; i++) {
    await db.websiteChange.create({
      data: { ...(websiteChanges[i] as any), detectedAt: hoursAgo(i * 5 + 2) },
    })
  }

  // Products
  const products = [
    { competitorId: 'comp_openai', name: 'ChatGPT', category: 'Consumer AI', description: 'Conversational AI assistant.', features: JSON.stringify(['Multimodal', 'Voice', 'Code interpreter', 'Web browsing']), integrations: JSON.stringify(['Slack', 'Zapier']), version: 'GPT-4o', status: 'Active' },
    { competitorId: 'comp_openai', name: 'GPT-4 API', category: 'Developer API', description: 'Frontier LLM API.', features: JSON.stringify(['Function calling', 'Vision', 'JSON mode', 'Assistants API']), integrations: JSON.stringify(['Azure', 'LangChain']), version: '2024-08-06', status: 'Active' },
    { competitorId: 'comp_openai', name: 'Sora', category: 'Generative Video', description: 'Text-to-video generation.', features: JSON.stringify(['1080p', '60s clips', 'Multi-shot']), integrations: JSON.stringify([]), version: 'Beta', status: 'Beta' },
    { competitorId: 'comp_anthropic', name: 'Claude 3.5 Sonnet', category: 'LLM', description: 'High-performance balanced model.', features: JSON.stringify(['200K context', 'Vision', 'Artifacts', 'Computer Use']), integrations: JSON.stringify(['Amazon Bedrock', 'Google Vertex']), version: 'claude-3-5-sonnet-20241022', status: 'Active' },
    { competitorId: 'comp_anthropic', name: 'Claude Enterprise', category: 'Enterprise', description: 'Team plan with admin & SSO.', features: JSON.stringify(['SSO', 'Admin console', 'Audit logs']), integrations: JSON.stringify(['Slack']), version: '1.0', status: 'Active' },
    { competitorId: 'comp_google_deepmind', name: 'Gemini 1.5 Pro', category: 'LLM', description: 'Multimodal model with 2M context.', features: JSON.stringify(['2M context', 'Vision', 'Audio', 'Video']), integrations: JSON.stringify(['Vertex AI', 'AI Studio']), version: '1.5', status: 'Active' },
    { competitorId: 'comp_google_deepmind', name: 'Gemini 1.5 Flash', category: 'LLM', description: 'Lightweight low-latency model.', features: JSON.stringify(['1M context', 'Vision', 'Audio']), integrations: JSON.stringify(['Vertex AI']), version: '1.5', status: 'Active' },
    { competitorId: 'comp_mistral', name: 'Mistral Large 2', category: 'LLM', description: 'Frontier open-weight model.', features: JSON.stringify(['128K context', 'Function calling', 'Code']), integrations: JSON.stringify(['La Plateforme', 'Azure']), version: '2', status: 'Active' },
    { competitorId: 'comp_meta_ai', name: 'Llama 3.1 405B', category: 'Open-Weight LLM', description: 'Frontier open-weight model.', features: JSON.stringify(['128K context', 'Tool use', 'Multilingual']), integrations: JSON.stringify(['Hugging Face', 'Together AI']), version: '3.1', status: 'Active' },
    { competitorId: 'comp_cohere', name: 'Command R+', category: 'Enterprise LLM', description: 'RAG-optimized model.', features: JSON.stringify(['128K context', 'Tool use', 'Citations']), integrations: JSON.stringify(['Coral', 'AWS Bedrock']), version: '08-2024', status: 'Active' },
    { competitorId: 'comp_perplexity', name: 'Perplexity Pro', category: 'AI Search', description: 'Subscription AI answer engine.', features: JSON.stringify(['Real-time search', 'Image gen', 'File upload']), integrations: JSON.stringify(['Browser extension']), version: '2024', status: 'Active' },
    { competitorId: 'comp_stability', name: 'Stable Diffusion 3.5', category: 'Image Generation', description: 'Open-weight image model.', features: JSON.stringify(['Up to 1024x1024', 'Multi-prompt']), integrations: JSON.stringify(['ComfyUI', 'Automatic1111']), version: '3.5', status: 'Active' },
  ]
  for (const p of products) {
    await db.product.create({ data: p as any })
  }

  // Pricing history
  const pricing = [
    { competitorId: 'comp_openai', planName: 'ChatGPT Plus', tier: 'Pro', billingCycle: 'Monthly', price: 20, previousPrice: null },
    { competitorId: 'comp_openai', planName: 'ChatGPT Team', tier: 'Pro', billingCycle: 'Monthly', price: 30, previousPrice: 25 },
    { competitorId: 'comp_openai', planName: 'ChatGPT Enterprise', tier: 'Enterprise', billingCycle: 'Annual', price: 60, previousPrice: null },
    { competitorId: 'comp_anthropic', planName: 'Claude Pro', tier: 'Pro', billingCycle: 'Monthly', price: 20, previousPrice: null },
    { competitorId: 'comp_anthropic', planName: 'Claude Team', tier: 'Pro', billingCycle: 'Monthly', price: 30, previousPrice: null },
    { competitorId: 'comp_anthropic', planName: 'Claude Enterprise', tier: 'Enterprise', billingCycle: 'Annual', price: 75, previousPrice: null },
    { competitorId: 'comp_google_deepmind', planName: 'Gemini Advanced', tier: 'Pro', billingCycle: 'Monthly', price: 19.99, previousPrice: null },
    { competitorId: 'comp_google_deepmind', planName: 'Gemini API (Pro)', tier: 'Pro', billingCycle: 'Pay-as-you-go', price: 1.25, previousPrice: 1.5, discount: '17% reduction' },
    { competitorId: 'comp_mistral', planName: 'La Plateforme — Large', tier: 'Pro', billingCycle: 'Pay-as-you-go', price: 2.0, previousPrice: 3.0, discount: '33% reduction' },
    { competitorId: 'comp_mistral', planName: 'Mistral Free', tier: 'Free', billingCycle: 'Monthly', price: 0, previousPrice: null },
    { competitorId: 'comp_cohere', planName: 'Production API', tier: 'Pro', billingCycle: 'Pay-as-you-go', price: 2.5, previousPrice: null },
    { competitorId: 'comp_perplexity', planName: 'Perplexity Pro', tier: 'Pro', billingCycle: 'Monthly', price: 20, previousPrice: 20 },
    { competitorId: 'comp_stability', planName: 'Creator Plan', tier: 'Pro', billingCycle: 'Monthly', price: 9, previousPrice: 11, discount: '18% reduction' },
  ]
  for (let i = 0; i < pricing.length; i++) {
    await db.pricingHistory.create({
      data: { ...(pricing[i] as any), changedAt: daysAgo(i) },
    })
  }

  // News
  const news = [
    { competitorId: 'comp_openai', title: 'OpenAI raises $6.6B at $157B valuation', source: 'Press Release', url: 'https://openai.com/blog', summary: 'OpenAI closes largest AI funding round ever, led by Thrive Capital.', category: 'Funding', sentiment: 'Positive', impact: 'High', publishedAt: daysAgo(2) },
    { competitorId: 'comp_openai', title: 'OpenAI opens new office in Tokyo', source: 'Google News', summary: 'Expanding Asia-Pacific presence with Tokyo HQ.', category: 'Expansion', sentiment: 'Positive', impact: 'Medium', publishedAt: daysAgo(5) },
    { competitorId: 'comp_openai', title: 'OpenAI appoints new CFO', source: 'Press Release', summary: 'Sarah Friar joins as CFO from Salesforce.', category: 'Leadership', sentiment: 'Positive', impact: 'Medium', publishedAt: daysAgo(9) },
    { competitorId: 'comp_anthropic', title: 'Anthropic partners with Amazon for $8B investment', source: 'Press Release', summary: 'Amazon doubles down on Anthropic with second major investment.', category: 'Partnership', sentiment: 'Positive', impact: 'High', publishedAt: daysAgo(7) },
    { competitorId: 'comp_anthropic', title: 'Anthropic launches Claude Enterprise', source: 'Blog', summary: 'New enterprise tier with admin console and SSO.', category: 'Product Launch', sentiment: 'Positive', impact: 'High', publishedAt: daysAgo(12) },
    { competitorId: 'comp_google_deepmind', title: 'Google DeepMind releases Gemini 1.5 Flash', source: 'Blog', summary: 'New lightweight model targets cost-sensitive workloads.', category: 'Product Launch', sentiment: 'Positive', impact: 'High', publishedAt: daysAgo(3) },
    { competitorId: 'comp_google_deepmind', title: 'DeepMind wins Queen\'s Award for Enterprise', source: 'Press Release', summary: 'Recognition for international trade and innovation.', category: 'Award', sentiment: 'Positive', impact: 'Low', publishedAt: daysAgo(15) },
    { competitorId: 'comp_mistral', title: 'Mistral AI raises €600M Series B', source: 'Google News', summary: 'European champion reaches €6B valuation.', category: 'Funding', sentiment: 'Positive', impact: 'High', publishedAt: daysAgo(10) },
    { competitorId: 'comp_meta_ai', title: 'Meta releases Llama 3.1 405B — first open-weight frontier model', source: 'Blog', summary: 'Largest open-weight LLM released, rivals GPT-4.', category: 'Product Launch', sentiment: 'Positive', impact: 'Critical', publishedAt: daysAgo(8) },
    { competitorId: 'comp_cohere', title: 'Cohere lands $500M Series D', source: 'Press Release', summary: 'Funding round led by PSP Investments.', category: 'Funding', sentiment: 'Positive', impact: 'High', publishedAt: daysAgo(14) },
    { competitorId: 'comp_perplexity', title: 'Perplexity launches Enterprise Pro', source: 'Blog', summary: 'New plan targets regulated industries with SOC2.', category: 'Product Launch', sentiment: 'Positive', impact: 'Medium', publishedAt: daysAgo(4) },
    { competitorId: 'comp_stability', title: 'Stability AI undergoes leadership reshuffle', source: 'Google News', summary: 'CEO steps down; interim CEO appointed.', category: 'Leadership', sentiment: 'Negative', impact: 'Medium', publishedAt: daysAgo(6) },
  ]
  for (const n of news) {
    await db.newsArticle.create({ data: n as any })
  }

  // Social posts
  const social = [
    { competitorId: 'comp_openai', platform: 'X', content: 'Introducing Sora — our new text-to-video model. Now available to creators.', postType: 'Announcement', likes: 28400, comments: 1850, shares: 6700, views: 2400000, sentiment: 'Positive', publishedAt: hoursAgo(36) },
    { competitorId: 'comp_openai', platform: 'LinkedIn', content: 'OpenAI is hiring across research, applied AI, and go-to-market. 200+ open roles globally.', postType: 'Announcement', likes: 8200, comments: 540, shares: 1900, views: 320000, sentiment: 'Positive', publishedAt: daysAgo(2) },
    { competitorId: 'comp_anthropic', platform: 'X', content: 'Claude 3.5 Sonnet now supports Computer Use (beta). Build agents that interact with desktops.', postType: 'Announcement', likes: 18600, comments: 980, shares: 4200, views: 1800000, sentiment: 'Positive', publishedAt: daysAgo(5) },
    { competitorId: 'comp_anthropic', platform: 'LinkedIn', content: 'New research on constitutional AI and alignment — read the full paper.', postType: 'Post', likes: 3400, comments: 210, shares: 740, views: 145000, sentiment: 'Positive', publishedAt: daysAgo(9) },
    { competitorId: 'comp_google_deepmind', platform: 'YouTube', content: 'Watch the Gemini 1.5 Flash demo — 1M-token multimodal reasoning.', postType: 'Video', likes: 42000, comments: 2300, shares: 5600, views: 8900000, sentiment: 'Positive', publishedAt: daysAgo(3) },
    { competitorId: 'comp_mistral', platform: 'X', content: 'Mixtral 8x22B now 33% cheaper on La Plateforme. Build more for less.', postType: 'Announcement', likes: 6700, comments: 320, shares: 1450, views: 540000, sentiment: 'Positive', publishedAt: daysAgo(4) },
    { competitorId: 'comp_meta_ai', platform: 'X', content: 'Llama 3.1 405B — open weights, frontier-class, free to download. Build the future.', postType: 'Announcement', likes: 54000, comments: 3400, shares: 12000, views: 5200000, sentiment: 'Positive', publishedAt: daysAgo(8) },
    { competitorId: 'comp_perplexity', platform: 'Instagram', content: 'Perplexity Spaces — your team\'s shared AI research hub. Try it today.', postType: 'Campaign', likes: 8900, comments: 410, shares: 980, views: 220000, sentiment: 'Positive', publishedAt: daysAgo(6) },
    { competitorId: 'comp_cohere', platform: 'LinkedIn', content: 'Cohere announces $500M Series D — accelerating enterprise AI globally.', postType: 'Announcement', likes: 6800, comments: 320, shares: 1450, views: 280000, sentiment: 'Positive', publishedAt: daysAgo(14) },
    { competitorId: 'comp_stability', platform: 'X', content: 'Stable Diffusion 3.5 is here. Three model sizes for every creator.', postType: 'Announcement', likes: 12300, comments: 870, shares: 2400, views: 890000, sentiment: 'Positive', publishedAt: daysAgo(11) },
  ]
  for (const s of social) {
    await db.socialPost.create({ data: s as any })
  }

  // Job postings
  const jobs = [
    { competitorId: 'comp_openai', title: 'Senior Research Engineer — Alignment', department: 'AI', seniority: 'Senior', location: 'San Francisco, US', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_openai', title: 'Product Manager — Enterprise', department: 'Product', seniority: 'Senior', location: 'San Francisco, US', jobType: 'Full-time', source: 'Greenhouse' },
    { competitorId: 'comp_openai', title: 'AI Research Scientist (x5)', department: 'AI', seniority: 'Senior', location: 'Remote', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_openai', title: 'Enterprise Account Executive', department: 'Sales', seniority: 'Mid', location: 'New York, US', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_openai', title: 'AI Safety Researcher', department: 'AI', seniority: 'Lead', location: 'San Francisco, US', jobType: 'Full-time', source: 'Careers Page' },
    { competitorId: 'comp_anthropic', title: 'Member of Technical Staff — Alignment', department: 'AI', seniority: 'Senior', location: 'San Francisco, US', jobType: 'Full-time', source: 'Greenhouse' },
    { competitorId: 'comp_anthropic', title: 'Research Engineer — Interpretability', department: 'AI', seniority: 'Senior', location: 'London, UK', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_anthropic', title: 'Go-to-Market Lead — Enterprise', department: 'Sales', seniority: 'Director', location: 'San Francisco, US', jobType: 'Full-time', source: 'Careers Page' },
    { competitorId: 'comp_google_deepmind', title: 'Senior Research Scientist — Multimodal', department: 'AI', seniority: 'Senior', location: 'London, UK', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_google_deepmind', title: 'Staff Software Engineer — Gemini', department: 'Engineering', seniority: 'Lead', location: 'Mountain View, US', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_google_deepmind', title: 'Product Manager — Vertex AI', department: 'Product', seniority: 'Senior', location: 'Mountain View, US', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_mistral', title: 'Research Engineer — Pretraining', department: 'AI', seniority: 'Senior', location: 'Paris, FR', jobType: 'Full-time', source: 'Greenhouse' },
    { competitorId: 'comp_mistral', title: 'AI Researcher (x3)', department: 'AI', seniority: 'Mid', location: 'Paris, FR', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_mistral', title: 'Developer Advocate', department: 'Marketing', seniority: 'Mid', location: 'Remote (EU)', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_meta_ai', title: 'Research Scientist — Llama', department: 'AI', seniority: 'Senior', location: 'Menlo Park, US', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_meta_ai', title: 'Research Engineer (x10)', department: 'AI', seniority: 'Mid', location: 'Menlo Park, US', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_cohere', title: 'Enterprise Account Executive', department: 'Sales', seniority: 'Senior', location: 'Toronto, CA', jobType: 'Full-time', source: 'LinkedIn' },
    { competitorId: 'comp_cohere', title: 'ML Researcher — RAG', department: 'AI', seniority: 'Senior', location: 'Toronto, CA', jobType: 'Full-time', source: 'Greenhouse' },
    { competitorId: 'comp_perplexity', title: 'Senior Software Engineer — Search', department: 'Engineering', seniority: 'Senior', location: 'San Francisco, US', jobType: 'Full-time', source: 'Greenhouse' },
    { competitorId: 'comp_perplexity', title: 'Growth Lead', department: 'Marketing', seniority: 'Lead', location: 'San Francisco, US', jobType: 'Full-time', source: 'LinkedIn' },
  ]
  for (let i = 0; i < jobs.length; i++) {
    await db.jobPosting.create({
      data: { ...(jobs[i] as any), postedAt: daysAgo(i % 14) },
    })
  }

  // Reviews
  const reviews = [
    { competitorId: 'comp_openai', source: 'G2', author: 'CTO, FinTech', rating: 4.7, title: 'Best-in-class LLM API', content: 'GPT-4 is the gold standard for our chatbot and document workflows. Reliability has improved dramatically.', sentiment: 'Positive', category: 'Praise' },
    { competitorId: 'comp_openai', source: 'Capterra', author: 'PM, SaaS', rating: 4.5, title: 'Powerful but expensive', content: 'ChatGPT Enterprise is excellent but pricing for high-volume API calls adds up quickly.', sentiment: 'Neutral', category: 'Complaint' },
    { competitorId: 'comp_openai', source: 'Trustpilot', author: 'Indie Dev', rating: 4.8, title: 'Indispensable tool', content: 'Use it daily for code, writing, research. Cannot imagine going back.', sentiment: 'Positive', category: 'Praise' },
    { competitorId: 'comp_openai', source: 'G2', author: 'Eng Lead', rating: 4.2, title: 'Need better function calling docs', content: 'Function calling works well but docs are scattered across multiple pages.', sentiment: 'Neutral', category: 'Feature Request' },
    { competitorId: 'comp_anthropic', source: 'G2', author: 'Data Scientist', rating: 4.6, title: 'Claude is my go-to for long docs', content: '200K context is a game-changer. Writes more naturally than GPT-4.', sentiment: 'Positive', category: 'Praise' },
    { competitorId: 'comp_anthropic', source: 'Capterra', author: 'Startup CEO', rating: 4.4, title: 'Great for analysis', content: 'Claude excels at structured analysis. Wish enterprise pricing was more transparent.', sentiment: 'Neutral', category: 'Complaint' },
    { competitorId: 'comp_anthropic', source: 'Product Hunt', author: 'Designer', rating: 4.9, title: 'Artifacts feature is brilliant', content: 'Iteratively building UI components with Claude is delightful.', sentiment: 'Positive', category: 'Praise' },
    { competitorId: 'comp_google_deepmind', source: 'G2', author: 'ML Engineer', rating: 4.5, title: 'Gemini multimodal is impressive', content: 'Native video understanding is genuinely useful for our media pipeline.', sentiment: 'Positive', category: 'Praise' },
    { competitorId: 'comp_google_deepmind', source: 'Capterra', author: 'Eng Manager', rating: 4.0, title: 'Vertex AI learning curve', content: 'Powerful platform but onboarding is steep for new teams.', sentiment: 'Neutral', category: 'Complaint' },
    { competitorId: 'comp_mistral', source: 'Product Hunt', author: 'OSS Maintainer', rating: 4.8, title: 'Mixtral for the win', content: 'Self-hosting Mixtral 8x22B saved us thousands per month.', sentiment: 'Positive', category: 'Praise' },
    { competitorId: 'comp_meta_ai', source: 'G2', author: 'Researcher', rating: 4.7, title: 'Llama 3.1 changed the game', content: 'Open weights at frontier quality is unprecedented. Community is thriving.', sentiment: 'Positive', category: 'Praise' },
    { competitorId: 'comp_meta_ai', source: 'Capterra', author: 'Startup CTO', rating: 4.3, title: 'Hosting costs are real', content: 'Llama is free to download but inference at scale is expensive.', sentiment: 'Neutral', category: 'Complaint' },
    { competitorId: 'comp_cohere', source: 'G2', author: 'Enterprise Architect', rating: 4.4, title: 'Best for RAG', content: 'Command R+ with built-in citations is purpose-built for our use case.', sentiment: 'Positive', category: 'Praise' },
    { competitorId: 'comp_perplexity', source: 'Product Hunt', author: 'Power User', rating: 4.6, title: 'Replaced my Google search', content: 'For research tasks, Perplexity is faster and more accurate.', sentiment: 'Positive', category: 'Praise' },
    { competitorId: 'comp_perplexity', source: 'Trustpilot', author: 'Free user', rating: 3.8, title: 'Citations could be better', content: 'Sometimes cites low-quality sources. Pro tier is much better.', sentiment: 'Negative', category: 'Complaint' },
    { competitorId: 'comp_stability', source: 'G2', author: 'Artist', rating: 4.0, title: 'SD3.5 is solid', content: 'Quality is good but ecosystem fragmentation is frustrating.', sentiment: 'Neutral', category: 'Complaint' },
  ]
  for (let i = 0; i < reviews.length; i++) {
    await db.review.create({
      data: { ...(reviews[i] as any), publishedAt: daysAgo(i) },
    })
  }

  // SWOT (pre-generated so the SWOT panel shows real content immediately)
  await db.swotAnalysis.create({
    data: {
      competitorId: 'comp_openai',
      strengths: JSON.stringify(['Strongest brand recognition in AI', 'Massive consumer base via ChatGPT', 'Largest funding war chest ($157B valuation)', 'Vertically integrated stack: research, product, API']),
      weaknesses: JSON.stringify(['High API pricing relative to open-weight alternatives', 'Heavy dependence on Microsoft for compute', 'Governance scrutiny and high executive turnover', 'Limited enterprise sales motion vs. incumbents']),
      opportunities: JSON.stringify(['Enterprise tier expansion', 'Voice AI and multimodal product surface', 'Vertical AI solutions (healthcare, finance)', 'Asia-Pacific expansion via Tokyo office']),
      threats: JSON.stringify(['Open-weight models (Llama 3.1) commoditizing capability', 'Anthropic gaining enterprise share', 'Regulatory pressure in EU and US', 'Compute cost inflation']),
      summary: 'OpenAI remains the category leader but faces intensifying pressure from open-weight alternatives and well-funded enterprise competitors.',
    },
  })
  await db.swotAnalysis.create({
    data: {
      competitorId: 'comp_anthropic',
      strengths: JSON.stringify(['Safety-first brand resonates with regulated industries', '200K+ context window competitive advantage', 'Deep Amazon partnership for compute & distribution', 'Claude 3.5 Sonnet outperforms on coding & analysis tasks']),
      weaknesses: JSON.stringify(['Smaller consumer footprint than OpenAI', 'Limited multimodal capability (no native video)', 'Narrower product portfolio', 'Higher enterprise pricing']),
      opportunities: JSON.stringify(['Claude Enterprise go-to-market', 'Computer Use API opens agentic use cases', 'Regulated industries (finance, healthcare) prefer safety story', 'EU expansion via Constitutional AI positioning']),
      threats: JSON.stringify(['OpenAI\'s brand and distribution advantage', 'Open-weight models eroding price premium', 'Amazon could forward-integrate', 'Talent retention in tight AI labor market']),
      summary: 'Anthropic is the strongest #2 in the LLM race, differentiated by safety and long-context capability.',
    },
  })

  // AI Summaries
  const summaries = [
    { competitorId: 'comp_openai', agentType: 'NewsAgent', title: 'OpenAI funding round closed', content: 'OpenAI\'s $6.6B raise at $157B valuation signals continued capital advantage. Expect accelerated product expansion, deeper enterprise investment, and potential M&A activity in adjacent verticals.', impact: 'High' },
    { competitorId: 'comp_openai', agentType: 'PricingAgent', title: 'ChatGPT Team price increased 20%', content: 'Team plan raised from $25 to $30 per user/month. Suggests pricing power and willingness to monetize collaboration features. Watch for churn signals in SMB segment.', impact: 'Medium' },
    { competitorId: 'comp_anthropic', agentType: 'ProductAgent', title: 'Computer Use API launched', content: 'Claude can now control desktops — agentic use cases unlocked. Strategic shift from chat to workflow automation. Likely attracts developer audience and enterprise RPA buyers.', impact: 'Critical' },
    { competitorId: 'comp_mistral', agentType: 'PricingAgent', title: 'Mistral Large 2 reduced 33%', content: 'Aggressive price cut positions Mistral as the value leader among API providers. Likely response to Llama 3.1 open-weight pressure. Expect competitors to follow.', impact: 'High' },
    { competitorId: 'comp_meta_ai', agentType: 'TrendAgent', title: 'Open-weight frontier is here', content: 'Llama 3.1 405B proves open-weight models can match closed frontier quality. Strategic implication: closed-model API margins will compress; differentiation shifts to product surface and data.', impact: 'Critical' },
    { competitorId: 'comp_google_deepmind', agentType: 'ProductAgent', title: 'Gemini 1.5 Flash released', content: 'Lightweight model targets cost-sensitive workloads. Indicates Google is competing on unit economics, not just capability. Watch for Vertex AI bundling.', impact: 'High' },
  ]
  for (const s of summaries) {
    await db.insight.create({ data: s as any })
  }

  // Alerts
  const alerts = [
    { competitorId: 'comp_anthropic', type: 'ProductLaunch', severity: 'Critical', title: 'Anthropic launched Computer Use API', message: 'New agentic capability allows Claude to control desktops. Major strategic shift.', recommendation: 'Evaluate competitive response: build similar agentic capability or partner with Anthropic.', isRead: false, isResolved: false },
    { competitorId: 'comp_mistral', type: 'PriceChange', severity: 'High', title: 'Mistral reduced pricing 33%', message: 'Mistral Large 2 price dropped from $3.00 to $2.00 per million tokens.', recommendation: 'Review API pricing strategy; consider promotional discount for high-volume customers.', isRead: false, isResolved: false },
    { competitorId: 'comp_meta_ai', type: 'ProductLaunch', severity: 'Critical', title: 'Meta released Llama 3.1 405B', message: 'Frontier-class open-weight model with 128K context released.', recommendation: 'Assess feasibility of self-hosting Llama 3.1 405B for cost reduction.', isRead: false, isResolved: false },
    { competitorId: 'comp_openai', type: 'Funding', severity: 'High', title: 'OpenAI raised $6.6B', message: 'Largest AI funding round ever. Expect aggressive expansion.', recommendation: 'Anticipate OpenAI entering adjacent markets; reinforce differentiation.', isRead: false, isResolved: false },
    { competitorId: 'comp_google_deepmind', type: 'ProductLaunch', severity: 'High', title: 'Gemini 1.5 Flash launched', message: 'New lightweight model targets low-latency use cases.', recommendation: 'Benchmark Gemini Flash against your current stack for cost optimization.', isRead: true, isResolved: false },
    { competitorId: 'comp_openai', type: 'PriceChange', severity: 'Medium', title: 'ChatGPT Team price increased', message: 'Team plan raised from $25 to $30 per user/month.', recommendation: 'Monitor SMB sentiment; consider retention campaign.', isRead: true, isResolved: false },
    { competitorId: 'comp_anthropic', type: 'Partnership', severity: 'High', title: 'Amazon doubles Anthropic investment', message: '$8B total commitment. AWS becomes preferred compute partner.', recommendation: 'If using AWS, expect deeper Bedrock integration; renegotiate enterprise agreement.', isRead: true, isResolved: true },
    { competitorId: 'comp_stability', type: 'Leadership', severity: 'Medium', title: 'Stability AI CEO change', message: 'Leadership transition may slow product cadence.', recommendation: 'De-risk any dependencies on Stability AI roadmap.', isRead: true, isResolved: true },
  ]
  for (let i = 0; i < alerts.length; i++) {
    await db.alert.create({ data: { ...(alerts[i] as any), createdAt: hoursAgo(i * 8) } })
  }

  // Pre-generated report
  await db.report.create({
    data: {
      title: 'Weekly Competitor Intelligence Report — W26',
      reportType: 'Weekly',
      period: 'Week 26, 2026',
      content: `# Weekly Competitor Intelligence Report — W26

## Executive Summary
This week saw three Critical-severity developments: Anthropic launched the Computer Use API, Meta released Llama 3.1 405B (frontier-class open weights), and Mistral cut Large 2 pricing by 33%. Together, these moves signal a structural shift — closed-model vendors face margin pressure while agentic capabilities emerge as the next battleground.

## Key Developments
- **Anthropic Computer Use API (Critical)** — Claude can now control desktops. Major agentic pivot.
- **Meta Llama 3.1 405B (Critical)** — First open-weight frontier model. Commoditizes closed-model quality.
- **Mistral 33% price cut (High)** — Value-leader positioning intensifies API price war.
- **OpenAI $6.6B raise (High)** — Largest AI funding ever; expect aggressive expansion.
- **Gemini 1.5 Flash (High)** — Google competing on unit economics.

## Strategic Recommendations
1. **Build agentic capability roadmap** — Computer Use raises the bar for "AI assistant" expectations.
2. **Re-evaluate model sourcing** — Llama 3.1 405B self-hosting now viable for high-volume workloads.
3. **Adjust pricing posture** — Defensive promotions for high-volume API customers likely needed.
4. **Reinforce differentiation** — Brand, data, and vertical depth matter more than raw capability.`,
      highlights: JSON.stringify([
        'Anthropic Computer Use API launched',
        'Meta Llama 3.1 405B released',
        'Mistral Large 2 price cut 33%',
        'OpenAI raised $6.6B',
      ]),
    },
  })

  // Sample chat history
  await db.chatHistory.create({
    data: {
      user: { connect: { id: 'user_default' } },
      role: 'assistant',
      content: 'Welcome to CompetitorIQ. Ask me about competitor changes, pricing, products, hiring, or strategic recommendations.',
    },
  })

  console.log('✅ Seeding complete.')
  console.log(`   Competitors: ${COMPETITORS.length}`)
  console.log(`   Agents: ${agents.length}`)
  console.log(`   Website changes: ${websiteChanges.length}`)
  console.log(`   Products: ${products.length}`)
  console.log(`   Pricing entries: ${pricing.length}`)
  console.log(`   News articles: ${news.length}`)
  console.log(`   Social posts: ${social.length}`)
  console.log(`   Job postings: ${jobs.length}`)
  console.log(`   Reviews: ${reviews.length}`)
  console.log(`   Alerts: ${alerts.length}`)
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
