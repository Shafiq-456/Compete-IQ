import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { businessName, businessNiche } = await req.json()

    if (!businessNiche) {
      return NextResponse.json({ error: 'Industry niche is required' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: businessName || null,
        businessNiche,
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (err: any) {
    console.error('[profile/patch] Failed to update user profile:', err.message)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
