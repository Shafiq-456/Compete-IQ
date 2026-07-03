// Stage C: Niche-aware agent priority mapping.
// Each niche gets a prioritized subset of agents that run first during onboarding.
// Documented choices below — designed to match what each industry actually cares about.

export type Niche =
  | 'E-commerce'
  | 'SaaS'
  | 'FinTech'
  | 'Healthcare'
  | 'Real Estate'
  | 'Education'
  | 'Marketing'
  | 'Food & Beverage'
  | 'Other'

export const NICHE_OPTIONS: { value: Niche; label: string; icon: string; description: string }[] = [
  { value: 'E-commerce', label: 'E-commerce', icon: '🛒', description: 'Online retail, DTC brands, marketplaces' },
  { value: 'SaaS', label: 'SaaS / Software', icon: '💻', description: 'B2B or B2C software platforms' },
  { value: 'FinTech', label: 'FinTech', icon: '💳', description: 'Payments, banking, lending, insurance' },
  { value: 'Healthcare', label: 'Healthcare', icon: '⚕️', description: 'Digital health, biotech, medical devices' },
  { value: 'Real Estate', label: 'Real Estate', icon: '🏠', description: 'PropTech, brokerage, rentals' },
  { value: 'Education', label: 'Education', icon: '🎓', description: 'EdTech, courses, learning platforms' },
  { value: 'Marketing', label: 'Marketing / Agency', icon: '📣', description: 'Agencies, ad-tech, growth tools' },
  { value: 'Food & Beverage', label: 'Food & Beverage', icon: '🍔', description: 'Restaurants, CPG, delivery' },
  { value: 'Other', label: 'Other', icon: '✨', description: 'Something else entirely' },
]

// Agent types match the existing Agent.type values in the schema.
export type AgentType =
  | 'WebsiteAgent' | 'NewsAgent' | 'PricingAgent' | 'ProductAgent' | 'ReviewAgent'
  | 'TrendAgent' | 'SWOTAgent' | 'ReportAgent' | 'RecommendationAgent' | 'SocialAgent' | 'CareerAgent'

// Each niche maps to an ordered list of agents (highest priority first).
// Reasoning for each mapping documented inline.
export const NICHE_AGENT_PRIORITY: Record<Niche, AgentType[]> = {
  // E-commerce: Pricing moves fast, products rotate constantly, social drives discovery.
  'E-commerce': ['PricingAgent', 'ProductAgent', 'SocialAgent', 'ReviewAgent', 'WebsiteAgent', 'NewsAgent', 'TrendAgent', 'SWOTAgent'],

  // SaaS: Pricing changes signal GTM shifts, product launches signal R&D direction,
  // news covers funding/M&A, hiring reveals growth areas.
  'SaaS': ['PricingAgent', 'ProductAgent', 'NewsAgent', 'CareerAgent', 'ReviewAgent', 'WebsiteAgent', 'SocialAgent', 'TrendAgent', 'SWOTAgent'],

  // FinTech: Regulatory/compliance news is the highest-signal channel,
  // followed by SWOT (strategic positioning), then trend analysis.
  'FinTech': ['NewsAgent', 'SWOTAgent', 'TrendAgent', 'PricingAgent', 'ProductAgent', 'CareerAgent', 'ReviewAgent', 'WebsiteAgent', 'SocialAgent'],

  // Healthcare: News (FDA, regulatory, partnerships) + reviews (patient/provider voice)
  // are the most useful signals; SWOT for strategic positioning.
  'Healthcare': ['NewsAgent', 'ReviewAgent', 'SWOTAgent', 'ProductAgent', 'CareerAgent', 'PricingAgent', 'WebsiteAgent', 'SocialAgent', 'TrendAgent'],

  // Real Estate: News (market moves, expansions) + product (platform features)
  // + reviews (customer experience) drive most insight.
  'Real Estate': ['NewsAgent', 'ProductAgent', 'ReviewAgent', 'PricingAgent', 'CareerAgent', 'WebsiteAgent', 'SocialAgent', 'TrendAgent', 'SWOTAgent'],

  // Education: Product (course/feature launches) + reviews (learner feedback)
  // + pricing (subscription changes) + news (institutional partnerships).
  'Education': ['ProductAgent', 'ReviewAgent', 'PricingAgent', 'NewsAgent', 'SocialAgent', 'WebsiteAgent', 'CareerAgent', 'TrendAgent', 'SWOTAgent'],

  // Marketing/Agency: Social campaigns + product launches + pricing tiers
  // (agencies resell/compare tools often) + news.
  'Marketing': ['SocialAgent', 'ProductAgent', 'PricingAgent', 'NewsAgent', 'ReviewAgent', 'WebsiteAgent', 'CareerAgent', 'TrendAgent', 'SWOTAgent'],

  // Food & Beverage: Social (visual campaigns, influencer posts) + reviews
  // (location/quality feedback) + news (expansions, supply chain).
  'Food & Beverage': ['SocialAgent', 'ReviewAgent', 'NewsAgent', 'ProductAgent', 'PricingAgent', 'WebsiteAgent', 'CareerAgent', 'TrendAgent', 'SWOTAgent'],

  // Other: balanced default priority across all channels.
  'Other': ['NewsAgent', 'PricingAgent', 'ProductAgent', 'ReviewAgent', 'WebsiteAgent', 'SocialAgent', 'CareerAgent', 'TrendAgent', 'SWOTAgent'],
}

// Human-readable agent metadata for the progress UI.
export const AGENT_META: Record<AgentType, { name: string; description: string; icon: string }> = {
  WebsiteAgent:    { name: 'Website Agent',    description: 'Detects page, UI, and content changes',           icon: '🌐' },
  NewsAgent:       { name: 'News Agent',       description: 'Funding, M&A, partnerships, leadership moves',    icon: '📰' },
  PricingAgent:    { name: 'Pricing Agent',    description: 'Tracks subscription price changes and discounts', icon: '💲' },
  ProductAgent:    { name: 'Product Agent',    description: 'Monitors product launches and feature updates',   icon: '📦' },
  ReviewAgent:     { name: 'Review Agent',     description: 'Analyzes customer reviews and sentiment',         icon: '⭐' },
  CareerAgent:     { name: 'Career Agent',     description: 'Tracks hiring signals and team expansion',        icon: '👥' },
  SocialAgent:     { name: 'Social Agent',     description: 'Monitors social posts and engagement',            icon: '📣' },
  TrendAgent:      { name: 'Trend Agent',      description: 'Identifies cross-competitor market trends',       icon: '📈' },
  SWOTAgent:       { name: 'SWOT Agent',       description: 'Generates strategic SWOT analyses',               icon: '🎯' },
  ReportAgent:     { name: 'Report Agent',     description: 'Compiles intelligence reports',                   icon: '📄' },
  RecommendationAgent: { name: 'Recommendation Agent', description: 'Suggests strategic actions',              icon: '💡' },
}

export function getAgentsForNiche(niche: Niche): AgentType[] {
  return NICHE_AGENT_PRIORITY[niche] ?? NICHE_AGENT_PRIORITY['Other']
}
