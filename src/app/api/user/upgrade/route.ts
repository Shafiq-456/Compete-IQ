import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const updated = await db.user.update({
      where: { id: user.id },
      data: { plan: 'premium' },
    })

    return NextResponse.json({
      ok: true,
      message: 'Plan upgraded to Premium successfully',
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        plan: updated.plan,
        hasSeenOnboarding: updated.hasSeenOnboarding,
        hasRunFirstScan: updated.hasRunFirstScan,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
