// Stage 2: Multi-tenancy scope helper
// All intelligence queries filter by the current user's competitor set.
import { db } from './db'
import { getCurrentUser } from './auth'

export async function getUserCompetitorIds(): Promise<{ userId: string; competitorIds: string[] }> {
  const user = await getCurrentUser()
  if (!user) return { userId: '', competitorIds: [] }
  const comps = await db.competitor.findMany({
    where: { userId: user.id },
    select: { id: true },
  })
  return { userId: user.id, competitorIds: comps.map((c) => c.id) }
}

// Filter object for Prisma where clauses
export async function userScope() {
  const { userId, competitorIds } = await getUserCompetitorIds()
  if (!userId) return { authorized: false as const, userId: '', competitorIds: [] as string[] }
  return { authorized: true as const, userId, competitorIds }
}
