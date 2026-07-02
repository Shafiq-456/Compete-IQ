---
Task ID: 1
Agent: main
Task: Build CompetitorIQ — AI Competitor Intelligence Agent (full Next.js 16 app)

Work Log:
- Confirmed existing project scaffold: Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite) + z-ai-web-dev-sdk
- Validated prisma/schema.prisma covering 16 models (User, Competitor, WebsiteChange, Product, PricingHistory, NewsArticle, SocialPost, JobPosting, Review, SwotAnalysis, Insight, Alert, Report, ChatHistory, Agent, AuditLog)
- Generated Prisma client and pushed schema to SQLite at db/custom.db
- Ran scripts/seed.ts which populated: 8 competitors, 11 AI agents, 10 website changes, 12 products, 13 pricing entries, 12 news articles, 10 social posts, 20 job postings, 16 reviews, 8 alerts
- Ran `bun next build` — compiled successfully (18s), all 20 routes generated (1 static page + 18 dynamic API + chat POST route)
- Started production server (.next/standalone/server.js) and verified endpoints:
  * GET / → HTTP 200, 56KB HTML with CompetitorIQ branding + all expected dashboard modules
  * GET /api/dashboard → 200, returns {stats, competitors, alerts, aiInsights, news, changes, pricing, jobs, products}
  * GET /api/competitors, /api/agents, /api/news, /api/products, /api/pricing, /api/careers, /api/social, /api/reviews, /api/reports, /api/insights, /api/analytics, /api/changes → all 200
  * GET /api/swot?competitorId=comp_openai → 200, returns AI-generated SWOT with real strengths/weaknesses/opportunities/threats
  * POST /api/chat with {message} → 200, returns AI reply grounded in database context (mentions Meta Llama 3.1, Anthropic Claude Enterprise, Gemini 1.5 Flash, Perplexity Enterprise Pro)
- Verified dev server (`bun run dev`) starts cleanly on port 3000

Stage Summary:
- 15 view components: dashboard, competitors, website, news, products, pricing, careers, social, reviews, swot, reports, chat, analytics, alerts, agents
- 17 API routes covering all 14 intelligence modules + chat + dashboard + analytics
- 11 specialized AI agents pre-configured (Website, News, Pricing, Product, Review, Trend, SWOT, Report, Recommendation, Social, Career)
- AI layer uses z-ai-web-dev-sdk for chat + SWOT generation, grounded in real DB context
- Database seeded with realistic competitor data (OpenAI, Anthropic, Google DeepMind, Meta, Mistral, Cohere, Perplexity, Hugging Face)
- Production build verified, all endpoints respond 200
- Dev server running on http://localhost:3000
