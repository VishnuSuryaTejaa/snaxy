import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const body = await req.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return NextResponse.json(
        { success: false, error: 'Invalid push subscription object' },
        { status: 400 }
      )
    }

    const userAgent = req.headers.get('user-agent') || undefined

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        authKey: keys.auth,
        p256dh: keys.p256dh,
        userAgent,
      },
      create: {
        endpoint,
        authKey: keys.auth,
        p256dh: keys.p256dh,
        userAgent,
      },
    })

    return NextResponse.json({ success: true, id: subscription.id })
  } catch (error) {
    console.error('[PUSH_SUBSCRIBE] Error saving subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save push subscription' },
      { status: 500 }
    )
  }
}
