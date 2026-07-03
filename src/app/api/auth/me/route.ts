import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      hasSeenOnboarding: user.hasSeenOnboarding,
      hasRunFirstScan: user.hasRunFirstScan,
      businessNiche: user.businessNiche,
      businessName: user.businessName,
    },
  })
}
