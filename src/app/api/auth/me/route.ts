import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionUserId = cookieStore.get('snaxy_user_session')?.value

    if (!sessionUserId || !/^[0-9a-fA-F]{24}$/.test(sessionUserId)) {
      return NextResponse.json({ success: true, user: null })
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, name: true, phone: true },
    })

    if (!user) {
      return NextResponse.json({ success: true, user: null })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Failed to get current user:', error)
    return NextResponse.json({ success: false, user: null }, { status: 500 })
  }
}
