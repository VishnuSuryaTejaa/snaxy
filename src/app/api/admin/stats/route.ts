import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ORDER_STATUS } from '@/lib/constants'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalToday, revenueToday, pending, preparing, ready] = await Promise.all([
      // Only count genuine orders submitted/placed today (exclude abandoned AWAITING_PAYMENT drafts, cancelled, and rejected)
      prisma.order.count({
        where: {
          createdAt: { gte: today },
          status: {
            notIn: [
              ORDER_STATUS.AWAITING_PAYMENT,
              ORDER_STATUS.CANCELLED,
              ORDER_STATUS.REJECTED,
            ],
          },
        },
      }),
      // Revenue is only accrued for orders with verified payment / processing / completed
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: {
            in: [
              ORDER_STATUS.VERIFIED,
              ORDER_STATUS.PREPARING,
              ORDER_STATUS.READY,
              ORDER_STATUS.COMPLETED,
            ],
          },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: { status: ORDER_STATUS.PAYMENT_SUBMITTED },
      }),
      prisma.order.count({
        where: { status: ORDER_STATUS.PREPARING },
      }),
      prisma.order.count({
        where: { status: ORDER_STATUS.READY },
      }),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalToday,
        revenueToday: revenueToday._sum.totalAmount ?? 0,
        pending,
        preparing,
        ready,
      },
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
