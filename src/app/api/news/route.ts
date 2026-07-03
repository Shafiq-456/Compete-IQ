import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ news: [] })
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const category = req.nextUrl.searchParams.get('category')
  const news = await db.newsArticle.findMany({
    where: {
      competitor: { userId: user.id },
      ...(competitorId && { competitorId }),
      ...(category && category !== 'all' && { category }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ news })
}
