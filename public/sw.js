/* eslint-disable no-restricted-globals */

// Snaxy PWA & Web Push Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Listen for incoming Web Push events from server
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const payload = event.data.json()
    const title = payload.title || 'Snaxy Alert'
    const options = {
      body: payload.body || 'New update available',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/badge-72.png',
      tag: payload.tag || 'snaxy-notification',
      data: {
        url: payload.url || '/admin',
        ...payload.data,
      },
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        {
          action: 'open_url',
          title: '👀 View in Dashboard',
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('[ServiceWorker] Push parse error:', err)
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/admin'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})
