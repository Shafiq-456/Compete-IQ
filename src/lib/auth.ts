// Stage 2: Simple cookie-based auth using signed JWT-like tokens.
// We avoid NextAuth complexity. Passwords are hashed with Web Crypto PBKDF2.

import { db } from './db'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'ciq_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const SECRET = process.env.AUTH_SECRET || 'competitoriq-dev-secret-change-in-prod'

// ---------- crypto helpers (Web Crypto, available in Next 16 runtime) ----------

async function pbkdf2(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return Buffer.from(bits).toString('hex')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const hash = await pbkdf2(password, salt)
  return `${salt}$${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split('$')
  if (!salt || !hash) return false
  const computed = await pbkdf2(password, salt)
  // constant-time compare
  if (computed.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ hash.charCodeAt(i)
  return diff === 0
}

// ---------- token (simple HMAC-signed payload) ----------

async function hmacSign(payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return Buffer.from(sig).toString('base64url')
}

async function hmacVerify(payload: string, sig: string): Promise<boolean> {
  const expected = await hmacSign(payload)
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}

export async function createSessionToken(userId: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000
  const payload = JSON.stringify({ uid: userId, exp: expiresAt })
  const payloadB64 = Buffer.from(payload).toString('base64url')
  const sig = await hmacSign(payloadB64)
  return `${payloadB64}.${sig}`
}

export async function verifySessionToken(token: string): Promise<{ uid: string; exp: number } | null> {
  try {
    const [payloadB64, sig] = token.split('.')
    if (!payloadB64 || !sig) return null
    if (!(await hmacVerify(payloadB64, sig))) return null
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return { uid: payload.uid, exp: payload.exp }
  } catch {
    return null
  }
}

// ---------- cookie helpers (server-side) ----------

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value
}

// ---------- current user resolver ----------

export async function getCurrentUser() {
  const token = await getSessionCookie()
  if (!token) return null
  const session = await verifySessionToken(token)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.uid } })
  return user
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
