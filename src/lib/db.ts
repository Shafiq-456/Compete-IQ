import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Automatically rewrite direct Supabase URLs (port 5432) to use connection pooler (port 6543) in serverless environments
const rawUrl = process.env.DATABASE_URL
let connectionUrl = rawUrl

if (rawUrl && rawUrl.includes('supabase.co') && rawUrl.includes(':5432')) {
  const basePooler = rawUrl.replace(':5432', ':6543')
  connectionUrl = basePooler.includes('?')
    ? `${basePooler}&pgbouncer=true`
    : `${basePooler}?pgbouncer=true`
  console.log('[prisma] Dynamically rewired database URL to connection pooler (port 6543)')
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasources: connectionUrl
      ? {
          db: {
            url: connectionUrl,
          },
        }
      : undefined,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db