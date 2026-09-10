import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')?.trim()

    const cookieStore = await cookies()
    const sessionUserId = cookieStore.get('snaxy_user_session')?.value
    const isValidUserId = sessionUserId && /^[0-9a-fA-F]{24}$/.test(sessionUserId)

    let orConditions: any[] = []

    if (isValidUserId) {
      // 1. Authenticated User: Strictly private to this user's account & registered phone
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true, phone: true },
      })

      if (user) {
        orConditions.push({ userId: user.id })
        if (user.phone) {
          orConditions.push({ customerPhone: user.phone })
        }
      }
    } else {
      // 2. Unauthenticated / Guest User:
      // Privacy Guard: Guests may ONLY access explicit orders created in their current guest session via 'ids'
      // Arbitrary phone searches without authentication are strictly blocked to prevent data leakage.
      if (idsParam) {
        const idList = idsParam
          .split(',')
          .map((id) => id.trim())
          .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))

        if (idList.length > 0) {
          orConditions.push({ id: { in: idList }, userId: null })
        }
      }
    }

    if (orConditions.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
      })
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: orConditions,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    const serializedOrders = orders.map((order) => ({
      id: order.id,
      shortCode: order.shortCode,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress,
      orderNotes: order.orderNotes,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      upiUtr: order.upiUtr,
      deliveryContactPhone: order.deliveryContactPhone,
      estimatedTime: order.estimatedTime,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        price: i.price,
        menuItem: {
          id: i.menuItem.id,
          name: i.menuItem.name,
          price: i.menuItem.price,
          imageUrl: i.menuItem.imageUrl,
          isVeg: i.menuItem.isVeg,
          category: i.menuItem.category,
        },
      })),
    }))

    return NextResponse.json({
      success: true,
      orders: serializedOrders,
    })
  } catch (error) {
    console.error('Failed to fetch user orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
