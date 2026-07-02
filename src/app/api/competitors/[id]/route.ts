import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const competitor = await db.competitor.findUnique({ where: { id } })
  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ competitor })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const updated = await db.competitor.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.industry !== undefined && { industry: body.industry }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.country !== undefined && { country: body.country }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.logo !== undefined && { logo: body.logo }),
      ...(body.employees !== undefined && { employees: body.employees }),
      ...(body.revenue !== undefined && { revenue: body.revenue }),
      ...(body.foundedYear !== undefined && { foundedYear: body.foundedYear ? Number(body.foundedYear) : null }),
    },
  })
  return NextResponse.json({ competitor: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.competitor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
