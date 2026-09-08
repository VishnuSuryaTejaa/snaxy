/**
 * One-time setup script to register the Telegram Bot Webhook endpoint with Telegram.
 *
 * Usage:
 *   node scripts/set-telegram-webhook.mjs <YOUR_PUBLIC_URL_OR_VERCEL_DOMAIN>
 *
 * Example:
 *   node scripts/set-telegram-webhook.mjs https://snaxy-app.vercel.app
 */

import 'dotenv/config'

const siteUrl = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL
const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET

if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set in environment or .env file.')
  process.exit(1)
}

if (!siteUrl) {
  console.error('❌ Error: Please provide your public domain / URL:')
  console.error('   node scripts/set-telegram-webhook.mjs https://your-domain.vercel.app')
  process.exit(1)
}

const cleanUrl = siteUrl.replace(/\/$/, '')
const webhookUrl = `${cleanUrl}/api/telegram/webhook`

console.log(`Setting Telegram webhook for bot to: ${webhookUrl}`)

const payload = {
  url: webhookUrl,
  allowed_updates: ['message', 'callback_query'],
}

if (secret) {
  payload.secret_token = secret
  console.log(`Securing webhook with secret token: ${secret.slice(0, 4)}...`)
}

try {
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (data.ok) {
    console.log('\n✅ Telegram Webhook registered successfully!')
    console.log(`Response: ${data.description}`)
  } else {
    console.error('\n❌ Telegram Webhook registration failed:', data.description)
  }
} catch (error) {
  console.error('\n❌ Network error while contacting Telegram API:', error)
}
