import ZAI from 'z-ai-web-dev-sdk'

let _zai: any = null

export async function getZAI() {
  if (_zai) return _zai
  _zai = await ZAI.create()
  return _zai
}

// ============================================================
// AI Chat Assistant – answers business questions in NL
// ============================================================
export async function aiChat(message: string, context?: string) {
  try {
    const zai = await getZAI()
    const systemPrompt = `You are CompetitorIQ, an AI business intelligence assistant specialized in competitor analysis.
You help users understand market dynamics by answering questions about competitors, pricing changes, product launches, hiring trends, news, and strategic positioning.

Guidelines:
- Be concise but thorough (3-6 short paragraphs max, unless asked for detail)
- Use bullet points for lists
- Reference specific competitors or events when relevant
- When recommending strategic actions, structure them as numbered steps
- If asked to compare companies, use clear comparison format
- Format responses in Markdown
- If context data is provided, USE it as the primary source of truth
${context ? `\n--- CURRENT COMPETITORIQ DATABASE SNAPSHOT ---\n${context}\n--- END SNAPSHOT ---` : ''}`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.6,
      max_tokens: 1200,
    })
    return response.choices?.[0]?.message?.content ?? 'No response from AI.'
  } catch (err: any) {
    return `(AI service unavailable: ${err?.message ?? 'unknown error'})`
  }
}

// ============================================================
// AI SWOT Generator – builds SWOT for a competitor
// ============================================================
export async function generateSWOT(competitorName: string, snapshot?: string) {
  try {
    const zai = await getZAI()
    const prompt = `You are a strategic business analyst. Generate a SWOT analysis for the competitor "${competitorName}".

${snapshot ? `Use this real monitoring data as the basis:\n${snapshot}\n` : ''}

Return STRICT JSON with this exact shape:
{
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "opportunities": ["...", "...", "..."],
  "threats": ["...", "...", "..."],
  "summary": "A 2-3 sentence executive summary.",
  "howToRespond": ["2-3 short, specific, actionable recommendations for how the user's business should react to this competitor's current activity. Each should be a concrete talking point or sales/playbook move, e.g. 'Emphasize your faster onboarding time in sales conversations, since [Competitor]'s recent reviews mention a slow setup process'."]
}

Each array should contain 3-5 concise, specific points grounded in real observations. The howToRespond array must contain 2-3 specific, actionable recommendations referencing actual observations from the data. Do not wrap the JSON in markdown fences.`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a JSON-only API. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    })
    const text = response.choices?.[0]?.message?.content ?? '{}'
    // Strip any code fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(cleaned)
  } catch (err: any) {
    return {
      strengths: ['Strong product portfolio'],
      weaknesses: ['Limited market visibility'],
      opportunities: ['Growing market demand'],
      threats: ['New entrants and pricing pressure'],
      summary: `SWOT generation fallback (AI unavailable: ${err?.message ?? 'error'}).`,
      howToRespond: ['Monitor this competitor closely for pricing or product changes and prepare a differentiation talking point.'],
    }
  }
}

// ============================================================
// AI Report Generator – daily/weekly/monthly/executive reports
// ============================================================
export async function generateReport(opts: {
  reportType: 'Daily' | 'Weekly' | 'Monthly' | 'Executive'
  period: string
  snapshot?: string
}) {
  try {
    const zai = await getZAI()
    const prompt = `Generate a ${opts.reportType} competitor intelligence report for the period: ${opts.period}.

${opts.snapshot ? `Use this monitoring snapshot:\n${opts.snapshot}\n` : ''}

Structure the report in Markdown:
# ${opts.reportType} Competitor Intelligence Report
## Executive Summary
(3-4 sentences)
## Key Developments
(bullet list of major events)
## Competitor Activity
(organized by competitor)
## Market Trends
(3-4 bullets)
## Strategic Recommendations
(numbered list of 3-5 actionable recommendations)
## Risk Assessment
(brief paragraph)

Be specific, data-driven, and actionable.`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a senior business intelligence analyst producing executive-ready reports.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1800,
    })
    return response.choices?.[0]?.message?.content ?? '# Report unavailable'
  } catch (err: any) {
    return `# ${opts.reportType} Report\n\nAI service unavailable (${err?.message}). Using snapshot data only.\n\n${opts.snapshot ?? ''}`
  }
}

// ============================================================
// AI News Summary – summarizes a news article's business impact
// ============================================================
export async function summarizeNews(title: string, content: string) {
  try {
    const zai = await getZAI()
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You summarize business news in 2-3 sentences, focusing on the strategic impact. Then add a "Business Impact:" sentence explaining what it means for competitors.',
        },
        { role: 'user', content: `Title: ${title}\n\nContent: ${content}` },
      ],
      temperature: 0.4,
      max_tokens: 200,
    })
    return response.choices?.[0]?.message?.content ?? ''
  } catch {
    return ''
  }
}

// ============================================================
// AI Recommendation – suggests strategic actions for an alert
// ============================================================
export async function recommendAction(alertTitle: string, alertMessage: string, competitorName?: string) {
  try {
    const zai = await getZAI()
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a strategic advisor. Given a competitor event, suggest 1-2 concise, actionable business responses. Keep it under 80 words. No headers, just direct advice.',
        },
        {
          role: 'user',
          content: `Competitor: ${competitorName ?? 'N/A'}\nEvent: ${alertTitle}\nDetails: ${alertMessage}\n\nSuggest strategic actions we should take:`,
        },
      ],
      temperature: 0.6,
      max_tokens: 250,
    })
    return response.choices?.[0]?.message?.content ?? ''
  } catch {
    return ''
  }
}

// ============================================================
// AI Insight for Dashboard – produces a top-level weekly insight
// ============================================================
export async function generateWeeklyInsight(snapshot: string) {
  try {
    const zai = await getZAI()
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You produce a single sharp weekly insight (under 120 words) for a competitor intelligence dashboard. Highlight the most strategically important development and what to do about it.',
        },
        { role: 'user', content: `Weekly data snapshot:\n${snapshot}` },
      ],
      temperature: 0.5,
      max_tokens: 300,
    })
    return response.choices?.[0]?.message?.content ?? ''
  } catch {
    return 'Weekly insight unavailable.'
  }
}

// ============================================================
// Stage B: AI personalized onboarding message — first-time chat greeting
// Generated (not hardcoded) from the user's niche + competitors + actual scan results
// ============================================================
export async function generateOnboardingWelcome(opts: {
  niche: string
  businessName?: string | null
  competitorNames: string[]
  scanTotals?: Record<string, number>
}): Promise<string> {
  try {
    const zai = await getZAI()
    const prompt = `Generate a friendly, personalized welcome message for a user who just finished onboarding on CompetitorIQ.

USER CONTEXT:
- Industry (niche): ${opts.niche}
- Business name: ${opts.businessName || 'N/A'}
- Tracked competitors: ${opts.competitorNames.length > 0 ? opts.competitorNames.join(', ') : 'none specified yet'}

INITIAL SCAN RESULTS:
${opts.scanTotals ? Object.entries(opts.scanTotals).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'No scan data yet'}

The message MUST follow this exact structure:
1. A one-line welcome that references their specific niche (e.g. "Welcome! I see you're in FinTech — here's how I can help you stay ahead.")
2. 3-4 short bullet points on what the platform does for them specifically in their niche (e.g. "I'll track pricing changes," "I'll flag new competitor product launches," etc.) — make each bullet specific to their industry, not generic
3. A clear next action — if scan results are non-zero, reference what was actually found (e.g. "I found ${opts.scanTotals?.pricingChanges || 0} recent pricing changes and ${opts.scanTotals?.products || 0} new product launches among your competitors"). If scan is zero, suggest "Try asking: 'What should I watch out for this month?'"

Format as Markdown. Keep it under 200 words. Be warm and specific — not generic boilerplate.`

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a friendly product onboarding assistant. Always respond in Markdown.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 500,
    })
    return response.choices?.[0]?.message?.content ?? ''
  } catch {
    // Fallback if AI is unavailable — still reference real scan data
    const p = opts.scanTotals?.pricingChanges || 0
    const pr = opts.scanTotals?.products || 0
    const n = opts.scanTotals?.newsArticles || 0
    return `Welcome to CompetitorIQ! I see you're in **${opts.niche}** — here's how I can help you stay ahead.

- I'll track pricing changes across your competitors in real time
- I'll flag new product launches and feature updates
- I'll monitor news, hiring signals, and customer reviews
- I'll generate SWOT analyses and strategic recommendations on demand

**Your first scan is complete.** I found ${p} pricing changes, ${pr} product launches, and ${n} news articles among your competitors. Ask me anything to dive deeper.`
  }
}
