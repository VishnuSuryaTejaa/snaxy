import crypto from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const COOKIE_NAME = 'snaxy_admin_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set and at least 16 chars in production')
    }
    return 'snaxy-dev-fallback-secret-minimum-32-chars-long'
  }
  return secret
}

export function isValidAdminCredentials(password: string, username?: string): boolean {
  const expectedPass = process.env.ADMIN_PASSWORD
  if (!expectedPass) {
    console.error('[AUTH] ADMIN_PASSWORD environment variable is not configured!')
    return false
  }

  // Constant-time comparison for password to avoid timing attacks
  const passA = Buffer.from(password)
  const passB = Buffer.from(expectedPass)
  if (passA.length !== passB.length) return false
  const passMatch = crypto.timingSafeEqual(passA, passB)

  if (username) {
    const expectedUser = process.env.ADMIN_USERNAME || 'admin'
    const userA = Buffer.from(username)
    const userB = Buffer.from(expectedUser)
    if (userA.length !== userB.length) return false
    return passMatch && crypto.timingSafeEqual(userA, userB)
  }

  return passMatch
}

/**
 * Creates a tamper-proof signed session token: "<timestamp>.<signature>"
 */
export function signAdminSession(): string {
  const secret = getSessionSecret()
  const timestamp = Date.now().toString()
  const payload = `admin:${timestamp}`
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${timestamp}.${hmac}`
}

/**
 * Validates a signed session token. Returns true if valid and not expired.
 */
export function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [timestampStr, receivedHmac] = parts
  const timestamp = parseInt(timestampStr, 10)
  if (isNaN(timestamp)) return false

  // Check expiration (7 days)
  const maxAgeMs = COOKIE_MAX_AGE * 1000
  if (Date.now() - timestamp > maxAgeMs) return false

  // Validate HMAC
  const secret = getSessionSecret()
  const payload = `admin:${timestampStr}`
  const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  const a = Buffer.from(receivedHmac)
  const b = Buffer.from(expectedHmac)
  if (a.length !== b.length) return false

  return crypto.timingSafeEqual(a, b)
}

/**
 * Server-side guard for admin API routes.
 * Usage:
 *   const authCheck = await requireAdmin()
 *   if (!authCheck.authorized) return authCheck.response
 */
export async function requireAdmin(): Promise<
  { authorized: true } | { authorized: false; response: NextResponse }
> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!verifyAdminSession(token)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required' },
        { status: 401 }
      ),
    }
  }

  return { authorized: true }
}
