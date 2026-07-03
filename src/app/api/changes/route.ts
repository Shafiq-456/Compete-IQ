import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ changes: [] })
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const changes = await db.websiteChange.findMany({
    where: {
      competitor: { userId: user.id },
      ...(competitorId ? { competitorId } : {}),
    },
    orderBy: { detectedAt: 'desc' },
    take: 50,
    include: { competitor: true },
  })
  return NextResponse.json({ changes })
}
