import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ pricing: [] })
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const pricing = await db.pricingHistory.findMany({
    where: {
      competitor: { userId: user.id },
      ...(competitorId ? { competitorId } : {}),
    },
    orderBy: { changedAt: 'desc' },
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ pricing })
}
