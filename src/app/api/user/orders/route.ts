import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phoneParam = searchParams.get('phone')?.trim().replace(/\D/g, '')
    const idsParam = searchParams.get('ids')?.trim()

    const cookieStore = await cookies()
    const sessionUserId = cookieStore.get('snaxy_user_session')?.value
    const isValidUserId = sessionUserId && /^[0-9a-fA-F]{24}$/.test(sessionUserId)

    // Build Prisma query condition
    const orConditions: any[] = []

    if (isValidUserId) {
      orConditions.push({ userId: sessionUserId })
      try {
        const user = await prisma.user.findUnique({
          where: { id: sessionUserId },
          select: { phone: true },
        })
        if (user?.phone) {
          orConditions.push({ customerPhone: user.phone })
        }
      } catch {
        // Continue
      }
    }

    if (phoneParam && phoneParam.length === 10) {
      orConditions.push({ customerPhone: phoneParam })
    }

    if (idsParam) {
      const idList = idsParam
        .split(',')
        .map((id) => id.trim())
        .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))

      if (idList.length > 0) {
        orConditions.push({ id: { in: idList } })
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
