export type NavKey =
  | 'dashboard'
  | 'competitors'
  | 'website'
  | 'news'
  | 'products'
  | 'pricing'
  | 'careers'
  | 'social'
  | 'reviews'
  | 'swot'
  | 'reports'
  | 'chat'
  | 'analytics'
  | 'alerts'
  | 'agents'

export const NAV_GROUPS: {
  label: string
  items: { key: NavKey; label: string; icon: string; description: string }[]
}[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', description: 'KPIs, recent activity, AI insights' },
      { key: 'analytics', label: 'Analytics', icon: 'BarChart3', description: 'Cross-competitor charts & trends' },
      { key: 'alerts', label: 'Alerts', icon: 'BellRing', description: 'Critical events & notifications' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { key: 'website', label: 'Website', icon: 'Globe', description: 'Page & UI change tracking' },
      { key: 'news', label: 'News', icon: 'Newspaper', description: 'Funding, M&A, partnerships' },
      { key: 'products', label: 'Products', icon: 'Package', description: 'Feature & launch tracking' },
      { key: 'pricing', label: 'Pricing', icon: 'DollarSign', description: 'Price change monitoring' },
      { key: 'careers', label: 'Careers', icon: 'Users', description: 'Hiring trends & signals' },
      { key: 'social', label: 'Social', icon: 'Share2', description: 'Posts, engagement, campaigns' },
      { key: 'reviews', label: 'Reviews', icon: 'Star', description: 'Sentiment & customer voice' },
    ],
  },
  {
    label: 'AI Studio',
    items: [
      { key: 'swot', label: 'SWOT', icon: 'Grid3x3', description: 'AI-generated SWOT matrices' },
      { key: 'reports', label: 'Reports', icon: 'FileText', description: 'Daily / weekly / executive reports' },
      { key: 'chat', label: 'Chat Assistant', icon: 'MessageSquare', description: 'Ask questions in natural language' },
      { key: 'agents', label: 'AI Agents', icon: 'Bot', description: 'Status of specialized agents' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { key: 'competitors', label: 'Competitors', icon: 'Building2', description: 'Add, edit, pause monitoring' },
    ],
  },
]
