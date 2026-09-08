import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ORDER_STATUS } from '@/lib/constants'
import { notifyAdmin } from '@/lib/notify'

// Basic HTML sanitizer
function sanitizeHtml(str: string | undefined): string | undefined {
  if (!str) return undefined
  return str.replace(/<[^>]*>?/gm, '').trim()
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { utr, payerName, screenshot } = body

    if (!utr) {
      return NextResponse.json(
        { success: false, error: '12-digit UPI UTR / Transaction Reference is required' },
        { status: 400 }
      )
    }

    const cleanUtr = utr.trim()

    // Validate 12-digit format
    if (!/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid UTR format. UPI UTR must be exactly 12 numeric digits.',
        },
        { status: 400 }
      )
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check for duplicate UTR across other orders (fraud prevention check)
    const duplicateUtrOrder = await prisma.order.findFirst({
      where: {
        upiUtr: cleanUtr,
        id: { not: id },
        status: { notIn: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED] },
      },
    })

    const duplicateUtrFlag = !!duplicateUtrOrder

    // Validate screenshot size if provided (cap to ~500KB base64 string length ~700KB)
    let safeScreenshot: string | null = null
    if (screenshot && typeof screenshot === 'string') {
      if (screenshot.length > 750000) {
        return NextResponse.json(
          { success: false, error: 'Payment screenshot is too large. Max 500KB.' },
          { status: 400 }
        )
      }
      safeScreenshot = screenshot
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        upiUtr: cleanUtr,
        payerName: sanitizeHtml(payerName) || null,
        paymentScreenshot: safeScreenshot,
        duplicateUtrFlag,
        status: ORDER_STATUS.PAYMENT_SUBMITTED,
      },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    })

    // Dispatch real-time multi-channel notification to Admin!
    await notifyAdmin('payment_submitted', {
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
    })

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        shortCode: updatedOrder.shortCode,
        status: updatedOrder.status,
        duplicateUtrFlag: updatedOrder.duplicateUtrFlag,
      },
    })
  } catch (error) {
    console.error('Failed to submit payment details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit payment details' },
      { status: 500 }
    )
  }
}
