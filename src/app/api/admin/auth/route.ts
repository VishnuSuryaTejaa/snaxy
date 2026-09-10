import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidAdminCredentials, signAdminSession, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password, username } = body

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    if (isValidAdminCredentials(password, username)) {
      const signedToken = signAdminSession()
      const cookieStore = await cookies()
      cookieStore.set(COOKIE_NAME, signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      })

      // Mutual exclusivity: Clear normal user session cookie on admin login
      cookieStore.delete('snaxy_user_session')

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid admin credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Admin Auth Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
