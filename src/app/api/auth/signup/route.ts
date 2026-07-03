import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    const normalizedEmail = email.toLowerCase().trim()
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        passwordHash,
        role: 'Admin',
        avatar: (name || normalizedEmail).slice(0, 2).toUpperCase(),
      },
    })

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
