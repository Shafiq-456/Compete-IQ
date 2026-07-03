import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ posts: [] })
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const platform = req.nextUrl.searchParams.get('platform')
  const posts = await db.socialPost.findMany({
    where: {
      competitor: { userId: user.id },
      ...(competitorId && { competitorId }),
      ...(platform && platform !== 'all' && { platform }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ posts })
}
