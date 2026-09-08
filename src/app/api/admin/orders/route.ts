import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ORDER_STATUS } from '@/lib/constants'
import { requireAdmin } from '@/lib/auth'

// API endpoint to fetch all active orders for the admin dashboard
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          notIn: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('Failed to fetch admin orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
