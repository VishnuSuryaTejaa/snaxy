import webpush from 'web-push'

console.log('Generating VAPID keys for Snaxy Web Push Notifications...')
const vapidKeys = webpush.generateVAPIDKeys()

console.log('\n✅ VAPID Keys Generated Successfully!')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_SUBJECT=mailto:admin@snaxy.local`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('\n👉 Copy and paste these 3 lines into your .env file or Vercel Environment Variables.')
