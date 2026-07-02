import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const competitors = await db.competitor.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ competitors })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const competitor = await db.competitor.create({
      data: {
        name: body.name,
        industry: body.industry || 'Unknown',
        website: body.website,
        country: body.country || 'Unknown',
        description: body.description || '',
        priority: body.priority || 'Medium',
        logo: body.logo || '🏢',
        status: 'Active',
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
