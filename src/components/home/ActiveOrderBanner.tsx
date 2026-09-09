'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChefHat, Clock, ArrowRight, X } from 'lucide-react'
import { ORDER_STATUS } from '@/lib/constants'

interface ActiveOrderSummary {
  id: string
  shortCode?: string | null
  status: string
  totalAmount: number
  itemsCount: number
}

export function ActiveOrderBanner() {
  const pathname = usePathname()
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSummary | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const checkActiveOrders = useCallback(async () => {
    try {
      let localIds: string[] = []
      let lastPhone = ''
      try {
        localIds = JSON.parse(localStorage.getItem('snaxy_recent_orders') || '[]')
        lastPhone = localStorage.getItem('snaxy_last_phone') || ''
      } catch {
        // Ignore
      }

      if (localIds.length === 0 && !lastPhone) {
        setActiveOrder(null)
        return
      }

      const params = new URLSearchParams()
      if (lastPhone && lastPhone.length === 10) params.append('phone', lastPhone)
      if (localIds.length > 0) params.append('ids', localIds.slice(0, 5).join(','))

      const res = await fetch(`/api/user/orders?${params.toString()}`)
      const data = await res.json()

      if (data.success && Array.isArray(data.orders)) {
        // Find latest order that is active
        const live = data.orders.find(
          (o: any) =>
            o.status !== ORDER_STATUS.COMPLETED &&
            o.status !== ORDER_STATUS.CANCELLED &&
            o.status !== ORDER_STATUS.REJECTED
        )

        if (live) {
          setActiveOrder({
            id: live.id,
            shortCode: live.shortCode,
            status: live.status,
            totalAmount: live.totalAmount,
            itemsCount: live.items?.length || 1,
          })
        } else {
          setActiveOrder(null)
        }
      }
    } catch {
      // Ignore
    }
  }, [])

  useEffect(() => {
    checkActiveOrders()
    const interval = setInterval(checkActiveOrders, 8000)
    return () => clearInterval(interval)
  }, [checkActiveOrders])

  // Don't show if on the exact order tracking page or admin
  if (
    dismissed ||
    !activeOrder ||
    pathname.startsWith('/order/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/checkout')
  ) {
    return null
  }

  const isReady = activeOrder.status === ORDER_STATUS.READY
  const isCooking = activeOrder.status === ORDER_STATUS.PREPARING

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-fade-in-up">
      <div
        className={`p-3.5 sm:p-4 rounded-3xl backdrop-blur-2xl border shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 ${
          isReady
            ? 'bg-emerald-950/90 border-emerald-500/50 ring-2 ring-emerald-500/30'
            : isCooking
            ? 'bg-slate-950/95 border-primary/50'
            : 'bg-slate-950/95 border-white/15'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isReady
                ? 'bg-emerald-500/20 border-emerald-500/40 text-xl'
                : 'bg-primary/20 border-primary/40 text-primary'
            }`}
          >
            {isReady ? (
              <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
            ) : isCooking ? (
              <ChefHat className="w-5 h-5 text-primary animate-pulse" />
            ) : (
              <Clock className="w-5 h-5 text-orange-400" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-orange-400 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md">
                {activeOrder.shortCode || `#${activeOrder.id.slice(-6).toUpperCase()}`}
              </span>
              <span
                className={`text-xs font-black truncate ${
                  isReady ? 'text-emerald-300' : 'text-white'
                }`}
              >
                {isReady
                  ? 'Your Food is Ready!'
                  : isCooking
                  ? 'Cooking in Kitchen'
                  : 'Order in Progress'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
              Tap to view real-time live kitchen tracker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/order/${activeOrder.id}`}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition active:scale-95 shadow-md ${
              isReady
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : 'bg-gradient-to-r from-primary to-rose-500 text-white hover:opacity-95'
            }`}
          >
            <span>Track</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
