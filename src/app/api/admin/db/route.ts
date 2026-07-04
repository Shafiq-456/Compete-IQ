import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        businessNiche: true,
        hasSeenOnboarding: true,
        hasRunFirstScan: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const stats = {
      usersCount: users.length,
      usersList: users,
      competitorsCount: await db.competitor.count(),
      alertsCount: await db.alert.count(),
      newsCount: await db.newsArticle.count(),
      changesCount: await db.websiteChange.count()
    }

    return NextResponse.json(stats)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, userId } = await req.json()

    if (action === 'delete-user' && userId) {
      await db.user.delete({ where: { id: userId } })
      return NextResponse.json({ success: true, message: `Deleted user ${userId}` })
    }

    if (action === 'clean-clutter') {
      // Keep only active users, delete users who haven't finished onboarding or are empty guests
      const incomplete = await db.user.findMany({
        where: {
          hasSeenOnboarding: false
        }
      })

      let count = 0
      for (const u of incomplete) {
        await db.user.delete({ where: { id: u.id } })
        count++
      }

      return NextResponse.json({ success: true, deletedCount: count })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
