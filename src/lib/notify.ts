/**
 * Unified Admin Notification Engine for Snaxy.
 *
 * Fanned out across zero-cost channels:
 * 1. Telegram Bot (Instant push with inline 1-tap Verify/Reject buttons)
 * 2. Web Push / PWA (Browser background push notifications with VAPID)
 * 3. In-App Notification Center (Persistent SQLite notification records + UI bell badge + Web Audio chime)
 */

import { prisma } from '@/lib/db'
import { sendTelegramNotification, NotificationEventType, TelegramOrderDetails } from './notify-telegram'
import { sendWebPushNotification } from './notify-webpush'

export type { NotificationEventType }

export interface NotifyOrderInput {
  id: string
  shortCode?: string | null
  totalAmount: number
  customerName: string
  customerPhone: string
  deliveryType: string
  deliveryAddress?: string | null
  items: Array<{ quantity: number; menuItem: { name: string } }>
  upiUtr?: string | null
  payerName?: string | null
  duplicateUtrFlag?: boolean
  paymentScreenshot?: string | null
}

/**
 * Dispatch notification across all channels.
 */
export async function notifyAdmin(
  event: NotificationEventType,
  order: NotifyOrderInput
): Promise<{ success: boolean; errors?: string[] }> {
  const shortId = order.shortCode || `#${order.id.slice(-6).toUpperCase()}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  let title = 'New Order Placed'
  let message = `Order ${shortId} for ₹${order.totalAmount.toFixed(0)} by ${order.customerName}`

  if (event === 'payment_submitted') {
    title = '💳 Payment Received (Pending Verification)'
    message = `Payment of ₹${order.totalAmount.toFixed(0)} submitted for ${shortId} (UTR: ${order.upiUtr || 'N/A'})`
  } else if (event === 'order_verified') {
    title = '✅ Order Payment Verified'
    message = `Order ${shortId} has been verified and is ready for preparation.`
  } else if (event === 'order_rejected') {
    title = '❌ Order Payment Rejected'
    message = `Payment for order ${shortId} was marked as rejected.`
  } else if (event === 'order_cancelled') {
    title = '⚠️ Order Cancelled'
    message = `Order ${shortId} was cancelled.`
  }

  const errors: string[] = []

  // 1. In-App Database Notification
  try {
    await prisma.adminNotification.create({
      data: {
        type: event,
        orderId: order.id,
        title,
        message,
      },
    })
  } catch (err) {
    console.error('[NOTIFY] Failed to write in-app notification:', err)
    errors.push(`DB: ${String(err)}`)
  }

  // 2. Telegram Notification (Inline buttons + deep link)
  try {
    const tgRes = await sendTelegramNotification(event, order)
    if (!tgRes.success && tgRes.error && !tgRes.error.includes('not configured')) {
      errors.push(`Telegram: ${tgRes.error}`)
    }
  } catch (err) {
    console.error('[NOTIFY] Telegram dispatch error:', err)
    errors.push(`Telegram: ${String(err)}`)
  }

  // 3. Web Push Notification (PWA / Browser)
  try {
    await sendWebPushNotification({
      title,
      body: message,
      url: `${siteUrl}/admin`,
      tag: `order-${order.id}`,
      data: {
        orderId: order.id,
        event,
      },
    })
  } catch (err) {
    console.error('[NOTIFY] Web Push dispatch error:', err)
    errors.push(`WebPush: ${String(err)}`)
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}
