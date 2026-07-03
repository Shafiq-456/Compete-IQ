import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ jobs: [] })
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const jobs = await db.jobPosting.findMany({
    where: {
      competitor: { userId: user.id },
      ...(competitorId ? { competitorId } : {}),
    },
    orderBy: { postedAt: 'desc' },
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ jobs })
}
