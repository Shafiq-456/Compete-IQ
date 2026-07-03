import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    const normalizedEmail = email.toLowerCase().trim()

    const user = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (!user || !user.passwordHash) {
      // Demo-user fallback: if no passwordHash but email matches demo analyst, allow passwordless
      if (user && user.email === 'analyst@competitoriq.ai') {
        await setSessionCookie(user.id)
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            hasSeenOnboarding: user.hasSeenOnboarding,
            hasRunFirstScan: user.hasRunFirstScan,
            businessNiche: user.businessNiche,
            businessName: user.businessName,
          },
        })
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    await setSessionCookie(user.id)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasSeenOnboarding: user.hasSeenOnboarding,
        hasRunFirstScan: user.hasRunFirstScan,
        businessNiche: user.businessNiche,
        businessName: user.businessName,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
