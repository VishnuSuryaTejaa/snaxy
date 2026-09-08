import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ORDER_STATUS } from '@/lib/constants'
import { notifyAdmin } from '@/lib/notify'

/**
 * Handles incoming webhooks from Telegram Bot API.
 * Supports inline one-tap Verify and Reject actions directly from admin Telegram chats.
 */
export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get('x-telegram-bot-api-secret-token')
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET

  // Validate webhook secret if configured
  if (expectedSecret && secretHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized webhook secret' }, { status: 401 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Telegram bot token missing' }, { status: 500 })
  }

  try {
    const update = await req.json()

    // Handle button callback queries
    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const callbackId = callbackQuery.id
      const data: string = callbackQuery.data || ''
      const message = callbackQuery.message

      const isVerify = data.startsWith('v:')
      const isReject = data.startsWith('r:')

      if (isVerify || isReject) {
        const orderId = data.slice(2)

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        })

        if (!order) {
          await answerCallback(token, callbackId, '⚠️ Order not found in database.')
          return NextResponse.json({ ok: true })
        }

        const newStatus = isVerify ? ORDER_STATUS.VERIFIED : ORDER_STATUS.REJECTED
        const statusLabel = isVerify ? '✅ Payment Verified' : '❌ Payment Rejected'

        // Update database
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status: newStatus },
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        })

        // Acknowledge callback immediately in Telegram UI
        await answerCallback(
          token,
          callbackId,
          `${statusLabel} for order ${order.shortCode || orderId.slice(-6).toUpperCase()}!`
        )

        // Update the telegram message to reflect the new state and remove action buttons
        if (message && message.chat && message.message_id) {
          const originalText = message.text || ''
          const updatedText = `${originalText}\n\n*Status Updated via Telegram:* ${statusLabel}`

          await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: message.chat.id,
              message_id: message.message_id,
              text: updatedText,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '👀 View in Admin Portal',
                      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`,
                    },
                  ],
                ],
              },
            }),
          })
        }

        // Echo event to in-app notifications and Web Push
        await notifyAdmin(isVerify ? 'order_verified' : 'order_rejected', {
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
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[TELEGRAM_WEBHOOK] Error processing update:', error)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram so it doesn't retry spam
  }
}

async function answerCallback(token: string, callbackQueryId: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: true,
      }),
    })
  } catch (err) {
    console.error('[TELEGRAM] answerCallback error:', err)
  }
}
