'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AdminNotificationItem } from '@/types'

/**
 * Plays a pleasant synthesized notification chime using browser Web Audio API.
 * Cold-start and asset-free.
 */
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    const now = ctx.currentTime

    // First note (E5 - 659.25Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, now)
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.35)

    // Second note (A5 - 880Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.12)
    gain2.gain.setValueAtTime(0.35, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.55)
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pushStatus, setPushStatus] = useState<'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported'>('idle')
  const prevUnreadRef = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications)
        const newUnread = data.unreadCount || 0

        // If new unread notifications arrived and count increased, play audio chime
        if (newUnread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
          playNotificationChime()
        }
        prevUnreadRef.current = newUnread
        setUnreadCount(newUnread)
      }
    } catch (err) {
      console.error('Failed to poll notifications:', err)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000) // Poll every 10s

    // Check Push permission status
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      if (Notification.permission === 'granted') {
        setPushStatus('granted')
      } else if (Notification.permission === 'denied') {
        setPushStatus('denied')
      } else {
        setPushStatus('prompt')
      }
    } else {
      setPushStatus('unsupported')
    }

    // Close on outside click
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      clearInterval(interval)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [fetchNotifications])

  async function markAllAsRead() {
    setLoading(true)
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      prevUnreadRef.current = 0
    } finally {
      setLoading(false)
    }
  }

  async function markSingleAsRead(id: string) {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('Failed to mark read:', err)
    }
  }

  async function subscribeToWebPush() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Web Push is not supported in this browser.')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushStatus('denied')
        alert('Push notification permission was denied in browser settings.')
        return
      }

      // Fetch VAPID public key
      const keyRes = await fetch('/api/push/vapid-public')
      const keyData = await keyRes.json()
      if (!keyData.success || !keyData.publicKey) {
        alert('VAPID keys not configured on server. See .env.example')
        return
      }

      // Register or get active SW
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(keyData.publicKey),
      })

      // Send to server
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      const saveData = await saveRes.json()
      if (saveData.success) {
        setPushStatus('granted')
        playNotificationChime()
        alert('🔔 Web Push Notifications Enabled! You will receive OS alerts for new orders and payments.')
      } else {
        alert('Failed to register push subscription on server.')
      }
    } catch (error) {
      console.error('Push subscription failed:', error)
      alert('Could not enable Web Push: ' + String(error))
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen && unreadCount > 0) {
            playNotificationChime()
          }
        }}
        className="relative p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus:outline-none"
        title="Admin Notifications"
        aria-label="Admin Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-neutral-50/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Web Push Banner in Drawer */}
          {pushStatus === 'prompt' && (
            <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center justify-between text-xs">
              <span className="text-amber-800 font-medium">Get instant alerts even when tab is closed</span>
              <button
                onClick={subscribeToWebPush}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-sm">
                <span className="text-3xl block mb-2">🔕</span>
                No notifications yet
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.read && markSingleAsRead(item.id)}
                  className={`p-3.5 hover:bg-neutral-50 transition cursor-pointer flex gap-3 items-start ${
                    !item.read ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <span className="text-lg mt-0.5">
                    {item.type === 'payment_submitted'
                      ? '💳'
                      : item.type === 'order_verified'
                      ? '✅'
                      : item.type === 'order_rejected'
                      ? '❌'
                      : '📦'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!item.read ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{item.message}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!item.read && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
