import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const source = req.nextUrl.searchParams.get('source')
  const reviews = await db.review.findMany({
    where: {
      ...(competitorId && { competitorId }),
      ...(source && source !== 'all' && { source }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ reviews })
}
