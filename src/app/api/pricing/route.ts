import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const pricing = await db.pricingHistory.findMany({
    where: competitorId ? { competitorId } : undefined,
    orderBy: { changedAt: 'desc' },
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ pricing })
}
