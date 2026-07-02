import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const changes = await db.websiteChange.findMany({
    where: competitorId ? { competitorId } : undefined,
    orderBy: { detectedAt: 'desc' },
    take: 50,
    include: { competitor: true },
  })
  return NextResponse.json({ changes })
}
