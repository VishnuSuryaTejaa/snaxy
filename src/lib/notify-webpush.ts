/**
 * Web Push Notification dispatcher using standard VAPID authentication.
 * Stores zero recurring cost and reaches browsers/PWA even when closed.
 */

import webPush from 'web-push'
import { prisma } from '@/lib/db'

export interface WebPushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

/**
 * Configure web-push with VAPID details if present in environment.
 */
function configureWebPush(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@snaxy.local'

  if (!publicKey || !privateKey) {
    return false
  }

  try {
    webPush.setVapidDetails(subject, publicKey, privateKey)
    return true
  } catch (error) {
    console.error('[WEBPUSH] Invalid VAPID config:', error)
    return false
  }
}

/**
 * Broadcasts a Web Push notification to all active admin browser subscriptions.
 */
export async function sendWebPushNotification(payload: WebPushPayload): Promise<{
  sent: number
  failed: number
}> {
  const isConfigured = configureWebPush()
  if (!isConfigured) {
    return { sent: 0, failed: 0 }
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany()
    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 }
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/badge-72.png',
      url: payload.url || '/admin',
      tag: payload.tag || 'snaxy-admin-alert',
      data: payload.data || {},
    })

    let sent = 0
    let failed = 0
    const deadSubscriptionIds: string[] = []

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.authKey,
            p256dh: sub.p256dh,
          },
        }

        try {
          await webPush.sendNotification(pushSubscription, payloadString)
          sent++
        } catch (error: any) {
          failed++
          // 404 or 410 indicates the subscription is expired or unsubscribed
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            deadSubscriptionIds.push(sub.id)
          } else {
            console.error(`[WEBPUSH] Send error for endpoint ${sub.endpoint.slice(0, 30)}:`, error?.message || error)
          }
        }
      })
    )

    // Clean up expired/stale subscriptions
    if (deadSubscriptionIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: deadSubscriptionIds } },
      })
    }

    return { sent, failed }
  } catch (error) {
    console.error('[WEBPUSH] Dispatcher error:', error)
    return { sent: 0, failed: 0 }
  }
}
