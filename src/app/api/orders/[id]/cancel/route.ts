import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { ORDER_STATUS } from '@/lib/constants'
import { notifyAdmin } from '@/lib/notify'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Parse optional cancellation reason
    let reason = ''
    try {
      const body = await request.json()
      if (body && typeof body.reason === 'string') {
        reason = body.reason.trim()
      }
    } catch {
      // Body is optional
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check authorization: User session, or guest session
    const cookieStore = await cookies()
    const sessionUserId = cookieStore.get('snaxy_user_session')?.value
    const adminSession = cookieStore.get('snaxy_admin_session')?.value

    const isAdmin = !!adminSession
    let isAuthorized = isAdmin

    if (!isAuthorized && sessionUserId) {
      // Check if order belongs to this user ID or phone
      if (order.userId === sessionUserId) {
        isAuthorized = true
      } else {
        const user = await prisma.user.findUnique({
          where: { id: sessionUserId },
          select: { phone: true },
        })
        if (user?.phone && user.phone === order.customerPhone) {
          isAuthorized = true
        }
      }
    } else if (!isAuthorized) {
      // Guest order authorization: Guest orders have userId == null
      if (order.userId === null) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to cancel this order' },
        { status: 403 }
      )
    }

    // Business Rules: Check whether order can be cancelled
    if (order.status === ORDER_STATUS.CANCELLED) {
      return NextResponse.json(
        { success: false, error: 'This order is already cancelled' },
        { status: 400 }
      )
    }

    if (order.status === ORDER_STATUS.REJECTED) {
      return NextResponse.json(
        { success: false, error: 'This order was rejected and cannot be cancelled' },
        { status: 400 }
      )
    }

    if (order.status === ORDER_STATUS.COMPLETED) {
      return NextResponse.json(
        { success: false, error: 'This order has already been completed and delivered' },
        { status: 400 }
      )
    }

    if (order.status === ORDER_STATUS.READY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Your food is already hot & ready for pickup! Please contact kitchen staff to request cancellation.',
        },
        { status: 400 }
      )
    }

    if (order.status === ORDER_STATUS.PREPARING) {
      return NextResponse.json(
        {
          success: false,
          error: 'The kitchen is already grilling and cooking your food. Automatic cancellation is no longer available.',
        },
        { status: 400 }
      )
    }

    // Allowed to cancel: AWAITING_PAYMENT, PAYMENT_SUBMITTED, VERIFIED
    const cancellationNote = reason
      ? `[Cancelled by customer: ${reason}]`
      : '[Cancelled by customer]'

    const updatedNotes = order.orderNotes
      ? `${order.orderNotes}\n${cancellationNote}`
      : cancellationNote

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: ORDER_STATUS.CANCELLED,
        orderNotes: updatedNotes,
      },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    })

    // Dispatch real-time cancellation alerts to Telegram, WebPush, and Admin in-app
    await notifyAdmin('order_cancelled', {
      id: updatedOrder.id,
      shortCode: updatedOrder.shortCode,
      totalAmount: updatedOrder.totalAmount,
      customerName: updatedOrder.customerName,
      customerPhone: updatedOrder.customerPhone,
      deliveryType: updatedOrder.deliveryType,
      deliveryAddress: updatedOrder.deliveryAddress,
      items: updatedOrder.items,
      upiUtr: updatedOrder.upiUtr,
      payerName: updatedOrder.payerName,
      duplicateUtrFlag: updatedOrder.duplicateUtrFlag,
      paymentScreenshot: updatedOrder.paymentScreenshot,
      deliveryContactPhone: updatedOrder.deliveryContactPhone,
      estimatedTime: updatedOrder.estimatedTime,
    })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: updatedOrder.id,
        shortCode: updatedOrder.shortCode,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      },
    })
  } catch (error) {
    console.error('Failed to cancel order:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred while cancelling your order' },
      { status: 500 }
    )
  }
}
