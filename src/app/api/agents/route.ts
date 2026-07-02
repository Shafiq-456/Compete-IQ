import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const agents = await db.agent.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ agents })
}
