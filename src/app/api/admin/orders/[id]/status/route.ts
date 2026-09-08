import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { ORDER_STATUS } from '@/lib/constants'
import { notifyAdmin } from '@/lib/notify'

// API endpoint to update order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { status } = body
    const resolvedParams = await params
    const { id: orderId } = resolvedParams

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId or status' },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    })

    // Echo event to other channels if verified or rejected
    if (status === ORDER_STATUS.VERIFIED) {
      await notifyAdmin('order_verified', {
        id: order.id,
        shortCode: order.shortCode,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryType: order.deliveryType,
        deliveryAddress: order.deliveryAddress,
        items: order.items,
        upiUtr: order.upiUtr,
        payerName: order.payerName,
        duplicateUtrFlag: order.duplicateUtrFlag,
        paymentScreenshot: order.paymentScreenshot,
      })
    } else if (status === ORDER_STATUS.REJECTED) {
      await notifyAdmin('order_rejected', {
        id: order.id,
        shortCode: order.shortCode,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryType: order.deliveryType,
        deliveryAddress: order.deliveryAddress,
        items: order.items,
        upiUtr: order.upiUtr,
        payerName: order.payerName,
        duplicateUtrFlag: order.duplicateUtrFlag,
        paymentScreenshot: order.paymentScreenshot,
      })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Failed to update order status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
