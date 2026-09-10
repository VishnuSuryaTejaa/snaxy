import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { name, phone, password } = await request.json()

    if (!name || !phone || !password) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } })
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Phone number already registered' }, { status: 400 })
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash
      }
    })

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name } })
    response.cookies.set('snaxy_user_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    // Mutual exclusivity: Clear admin session when registering as a user
    response.cookies.delete('snaxy_admin_session')

    return response
  } catch (error) {
    console.error('Registration failed:', error)
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 })
  }
}
