import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const competitors = await db.competitor.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ competitors })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const threatLevel = body.threatLevel || (body.priority === 'High' ? 'High' : body.priority === 'Medium' ? 'Medium' : 'Low')
    const competitor = await db.competitor.create({
      data: {
        userId: user.id,
        name: body.name,
        industry: body.industry || 'Unknown',
        website: body.website,
        country: body.country || 'Unknown',
        description: body.description || '',
        priority: body.priority || 'Medium',
        logo: body.logo || '🏢',
        status: 'Active',
        threatLevel,
        foundedYear: body.foundedYear ? Number(body.foundedYear) : null,
        employees: body.employees || null,
        revenue: body.revenue || null,
        socialLinks: body.socialLinks ? JSON.stringify(body.socialLinks) : null,
        productCatalog: body.products ? JSON.stringify(body.products) : null,
      },
    })
    return NextResponse.json({ competitor })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
