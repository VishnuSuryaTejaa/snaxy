/**
 * Telegram Bot API client using standard fetch (zero heavy dependencies, cold-start free).
 * Free non-commercial notification channel with actionable inline buttons.
 */

export interface TelegramOrderDetails {
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

export type NotificationEventType =
  | 'order_placed'
  | 'payment_submitted'
  | 'order_verified'
  | 'order_rejected'
  | 'order_cancelled'

/**
 * Sends a rich notification to the admin via Telegram Bot API with inline action buttons.
 */
export async function sendTelegramNotification(
  event: NotificationEventType,
  order: TelegramOrderDetails
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!token || !chatId) {
    // Graceful skip if Telegram bot credentials are not configured yet
    return { success: false, error: 'Telegram bot credentials not configured' }
  }

  const shortId = order.shortCode || `#${order.id.slice(-6).toUpperCase()}`
  const itemsText = order.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', ')
  const deliveryIcon = order.deliveryType === 'delivery' ? '🛵 Delivery' : '🛍️ Pickup'

  let emoji = '🔔'
  let headerTitle = 'New Order Placed'

  if (event === 'payment_submitted') {
    emoji = '💳'
    headerTitle = 'Payment Submitted — Pending Verification'
  } else if (event === 'order_verified') {
    emoji = '✅'
    headerTitle = 'Order Payment Verified'
  } else if (event === 'order_rejected') {
    emoji = '❌'
    headerTitle = 'Order Payment Rejected'
  } else if (event === 'order_cancelled') {
    emoji = '⚠️'
    headerTitle = 'Order Cancelled'
  }

  let text = `${emoji} *Snaxy: ${headerTitle}*\n`
  text += `━━━━━━━━━━━━━━━━━━━━\n`
  text += `📦 *Order:* \`${shortId}\`\n`
  text += `💰 *Total Amount:* ₹${order.totalAmount.toFixed(0)}\n`
  text += `👤 *Customer:* ${escapeMarkdown(order.customerName)} (${order.customerPhone})\n`
  text += `📍 *Type:* ${deliveryIcon}`
  if (order.deliveryAddress) {
    text += ` — ${escapeMarkdown(order.deliveryAddress)}`
  }
  text += `\n`
  text += `🍽️ *Items:* ${escapeMarkdown(itemsText)}\n`

  if (order.upiUtr) {
    text += `🔢 *UTR:* \`${order.upiUtr}\`\n`
  }
  if (order.payerName) {
    text += `💳 *Payer Name:* ${escapeMarkdown(order.payerName)}\n`
  }
  if (order.duplicateUtrFlag) {
    text += `⚠️ *WARNING: Duplicate UTR detected across orders!*\n`
  }

  text += `\n⏰ _${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST_`

  // Inline action buttons:
  // Telegram callback_data limit is 64 bytes. CUID is ~25-30 bytes, so "v:<id>" easily fits (<35 bytes).
  const inlineKeyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> = []

  if (event === 'payment_submitted' || event === 'order_placed') {
    inlineKeyboard.push([
      { text: '✅ Verify Payment', callback_data: `v:${order.id}` },
      { text: '❌ Reject', callback_data: `r:${order.id}` },
    ])
  }

  // Always offer a direct link to the order on the admin dashboard
  inlineKeyboard.push([
    { text: '👀 View in Admin Portal', url: `${siteUrl}/admin` },
    { text: '📄 Customer Tracker', url: `${siteUrl}/order/${order.id}` },
  ])

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }),
    })

    const data = await res.json()
    if (!data.ok) {
      console.error('[TELEGRAM] Send failed:', data)
      return { success: false, error: data.description }
    }

    return { success: true }
  } catch (error) {
    console.error('[TELEGRAM] Network error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Escapes characters for Telegram MarkdownV1
 */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
}
