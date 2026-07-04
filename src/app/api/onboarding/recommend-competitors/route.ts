import { NextRequest, NextResponse } from 'next/server'
import { groqChat } from '@/lib/ai'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const niche = searchParams.get('niche')

  if (!niche) {
    return NextResponse.json({ error: 'Niche is required' }, { status: 400 })
  }

  const prompt = `You are a market analyst assistant. Recommend exactly 5 major, actual global competitors for a business operating in the "${niche}" industry niche.
  
Return a STRICT JSON array only (no markdown fences, no formatting, no prose). Each object in the array must have "name" (the competitor's business name) and "website" (their real homepage URL starting with https://).

Example shape:
[
  { "name": "Stripe", "website": "https://stripe.com" },
  { "name": "Adyen", "website": "https://adyen.com" }
]

Rules:
- Give exactly 5 items
- Output valid JSON only, no commentary before or after`

  try {
    const text = await groqChat([
      { role: 'system', content: 'You are a JSON-only API. Respond with valid JSON only. No markdown fences. No prose.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.5, max_tokens: 800 })

    let cleaned = text.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    }

    const recommendations = JSON.parse(cleaned)
    return NextResponse.json({ recommendations })
  } catch (err: any) {
    console.error('[recommend-competitors] Failed to fetch AI recommendations:', err.message)
    // Dynamic local fallback if Groq fails or is not configured
    const fallbacks: Record<string, { name: string; website: string }[]> = {
      'SaaS': [
        { name: 'Salesforce', website: 'https://salesforce.com' },
        { name: 'HubSpot', website: 'https://hubspot.com' },
        { name: 'ZoomInfo', website: 'https://zoominfo.com' },
        { name: 'Monday.com', website: 'https://monday.com' },
        { name: 'Asana', website: 'https://asana.com' }
      ],
      'FinTech': [
        { name: 'Stripe', website: 'https://stripe.com' },
        { name: 'Adyen', website: 'https://adyen.com' },
        { name: 'Checkout.com', website: 'https://checkout.com' },
        { name: 'Revolut', website: 'https://revolut.com' },
        { name: 'Wise', website: 'https://wise.com' }
      ],
      'E-commerce': [
        { name: 'Shopify', website: 'https://shopify.com' },
        { name: 'Amazon', website: 'https://amazon.com' },
        { name: 'Magento', website: 'https://adobe.com/commerce' },
        { name: 'WooCommerce', website: 'https://woocommerce.com' },
        { name: 'BigCommerce', website: 'https://bigcommerce.com' }
      ],
      'Healthcare': [
        { name: 'Veeva Systems', website: 'https://veeva.com' },
        { name: 'Cerner', website: 'https://oracle.com/health' },
        { name: 'Epic Systems', website: 'https://epic.com' },
        { name: 'Athenahealth', website: 'https://athenahealth.com' },
        { name: 'WebMD', website: 'https://webmd.com' }
      ]
    }
    const recommendations = fallbacks[niche] || [
      { name: 'Google', website: 'https://google.com' },
      { name: 'Microsoft', website: 'https://microsoft.com' },
      { name: 'Meta', website: 'https://meta.com' },
      { name: 'Apple', website: 'https://apple.com' },
      { name: 'Amazon', website: 'https://amazon.com' }
    ]
    return NextResponse.json({ recommendations })
  }
}
