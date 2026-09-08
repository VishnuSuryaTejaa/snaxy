import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.adminNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.adminNotification.count({
        where: { read: false },
      }),
    ])

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Failed to fetch admin notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const body = await req.json().catch(() => ({}))
    const { id, markAllRead } = body

    if (markAllRead) {
      await prisma.adminNotification.updateMany({
        where: { read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true, message: 'All marked as read' })
    }

    if (id) {
      await prisma.adminNotification.update({
        where: { id },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Provide id or markAllRead: true' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to update notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
