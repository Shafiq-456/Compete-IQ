import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const competitorId = req.nextUrl.searchParams.get('competitorId')
  const products = await db.product.findMany({
    where: competitorId ? { competitorId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { competitor: true },
  })
  return NextResponse.json({ products })
}
