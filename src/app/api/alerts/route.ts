import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ alerts: [] }, { status: 200 })

  const severity = req.nextUrl.searchParams.get('severity')
  const alerts = await db.alert.findMany({
    where: {
      competitor: { userId: user.id },
      ...(severity ? { severity } : {}),
    },
    orderBy: [
      // Stage D: sort by threat level (severity) by default, then recency
      { severity: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 100,
    include: { competitor: true },
  })
  return NextResponse.json({ alerts })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, isRead, isResolved } = body
  // verify ownership
  const existing = await db.alert.findUnique({ where: { id }, include: { competitor: true } })
  if (!existing || existing.competitor?.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const updated = await db.alert.update({
    where: { id },
    data: {
      ...(isRead !== undefined && { isRead }),
      ...(isResolved !== undefined && { isResolved }),
    },
  })
  return NextResponse.json({ alert: updated })
}
