import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ products: [] })
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const products = await db.product.findMany({
    where: {
      competitor: { userId: user.id },
      ...(competitorId ? { competitorId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { competitor: true },
  })
  return NextResponse.json({ products })
}
