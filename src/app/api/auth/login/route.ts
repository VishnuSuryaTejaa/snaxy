import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: 'Missing phone or password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    if (user.passwordHash !== passwordHash) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name } })
    response.cookies.set('snaxy_user_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    // Mutual exclusivity: Clear admin session when logging in as a user
    response.cookies.delete('snaxy_admin_session')

    return response
  } catch (error) {
    console.error('Login failed:', error)
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}
