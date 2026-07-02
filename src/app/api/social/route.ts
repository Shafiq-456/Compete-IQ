import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const platform = req.nextUrl.searchParams.get('platform')
  const posts = await db.socialPost.findMany({
    where: {
      ...(competitorId && { competitorId }),
      ...(platform && platform !== 'all' && { platform }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ posts })
}
