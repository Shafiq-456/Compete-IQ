import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const category = req.nextUrl.searchParams.get('category')
  const news = await db.newsArticle.findMany({
    where: {
      ...(competitorId && { competitorId }),
      ...(category && category !== 'all' && { category }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ news })
}
