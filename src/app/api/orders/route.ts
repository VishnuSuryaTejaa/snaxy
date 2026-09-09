import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { ORDER_STATUS } from '@/lib/constants'
import { notifyAdmin } from '@/lib/notify'
import crypto from 'crypto'

// Basic HTML sanitizer
function sanitizeHtml(str: string | undefined): string | undefined {
  if (!str) return undefined
  return str.replace(/<[^>]*>?/gm, '').trim()
}

/**
 * Generate a short memorable code for UPI transaction reference (e.g. SNX-7K9A)
 */
function generateShortCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Base32 without confusing chars (0, O, 1, I)
  const bytes = crypto.randomBytes(4)
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return `SNX-${code}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      phone,
      deliveryType,
      address,
      notes,
      paymentMethod = 'upi',
      items,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 })
    }

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone number are required' },
        { status: 400 }
      )
    }

    if (!address || !address.trim()) {
      return NextResponse.json(
        { success: false, error: 'Campus Spot / Hostel Room location is required' },
        { status: 400 }
      )
    }

    // Server-side item & price validation
    interface OrderInputItem {
      id?: string
      menuItemId?: string
      quantity: number
    }

    const rawItems = items as OrderInputItem[]
    const itemIds = rawItems
      .map((i) => i.menuItemId || i.id)
      .filter((id): id is string => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id))

    if (itemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid items in cart. Please re-add snacks from the menu.' },
        { status: 400 }
      )
    }

    const dbItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    })

    let calculatedTotal = 0
    const validItems = []

    for (const item of rawItems) {
      const targetId = item.menuItemId || item.id
      const dbItem = dbItems.find((dbI) => dbI.id === targetId)

      if (!dbItem) {
        return NextResponse.json(
          {
            success: false,
            error: 'One or more items in your tray are no longer available. Please refresh the menu.',
          },
          { status: 400 }
        )
      }

      if (dbItem.isSoldOut) {
        return NextResponse.json(
          {
            success: false,
            error: `"${dbItem.name}" is currently sold out. Please remove it from your tray.`,
          },
          { status: 400 }
        )
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
      const price = dbItem.price
      calculatedTotal += price * qty

      validItems.push({
        menuItemId: dbItem.id,
        quantity: qty,
        price: price,
      })
    }

    const cookieStore = await cookies()
    const rawUserId = cookieStore.get('snaxy_user_session')?.value
    const isValidObjectId = rawUserId && /^[0-9a-fA-F]{24}$/.test(rawUserId)
    const userId = isValidObjectId ? rawUserId : null

    const shortCode = generateShortCode()
    const isCash = paymentMethod === 'cash'
    const initialStatus = isCash ? ORDER_STATUS.PAYMENT_SUBMITTED : ORDER_STATUS.AWAITING_PAYMENT

    // Create the order and its items
    const order = await prisma.order.create({
      data: {
        shortCode,
        customerName: sanitizeHtml(name) || name,
        customerPhone: sanitizeHtml(phone) || phone,
        deliveryType: deliveryType || 'delivery',
        deliveryAddress: sanitizeHtml(address) || null,
        orderNotes: sanitizeHtml(notes) || null,
        totalAmount: calculatedTotal,
        paymentMethod,
        status: initialStatus,
        userId: userId || null,
        items: {
          create: validItems,
        },
      },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    })

    // If payment method is cash, alert admin immediately
    if (isCash) {
      await notifyAdmin('order_placed', {
        id: order.id,
        shortCode: order.shortCode,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryType: order.deliveryType,
        deliveryAddress: order.deliveryAddress,
        items: order.items,
        upiUtr: order.upiUtr,
      })
    }

    // Housekeeping: background cleanup of abandoned awaiting_payment orders (> 30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
    prisma.order
      .updateMany({
        where: {
          status: ORDER_STATUS.AWAITING_PAYMENT,
          createdAt: { lt: thirtyMinsAgo },
        },
        data: { status: ORDER_STATUS.CANCELLED },
      })
      .catch((err) => console.error('[HOUSEKEEPING] Cleanup error:', err))

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        shortCode: order.shortCode,
        totalAmount: order.totalAmount,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
