import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { ORDER_STATUS } from '@/lib/constants'
import { notifyAdmin } from '@/lib/notify'

// API endpoint to update order status, custom contact phone, and estimated delivery time
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { status, deliveryContactPhone, estimatedTime } = body
    const resolvedParams = await params
    const { id: orderId } = resolvedParams

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId' },
        { status: 400 }
      )
    }

    const updateData: {
      status?: string
      deliveryContactPhone?: string | null
      estimatedTime?: string | null
    } = {}

    if (status) updateData.status = status
    if (deliveryContactPhone !== undefined) {
      updateData.deliveryContactPhone = deliveryContactPhone ? deliveryContactPhone.trim() : null
    }
    if (estimatedTime !== undefined) {
      updateData.estimatedTime = estimatedTime ? estimatedTime.trim() : null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No update fields provided' },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
        deliveryContactPhone: order.deliveryContactPhone,
        estimatedTime: order.estimatedTime,
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
