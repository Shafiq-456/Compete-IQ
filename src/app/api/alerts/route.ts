import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const severity = req.nextUrl.searchParams.get('severity')
  const alerts = await db.alert.findMany({
    where: severity ? { severity } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ alerts })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, isRead, isResolved } = body
  const updated = await db.alert.update({
    where: { id },
    data: {
      ...(isRead !== undefined && { isRead }),
      ...(isResolved !== undefined && { isResolved }),
    },
  })
  return NextResponse.json({ alert: updated })
}
