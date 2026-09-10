'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChefHat, Clock, ArrowRight, X, ShieldCheck } from 'lucide-react'
import { ORDER_STATUS } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'

interface ActiveOrderSummary {
  id: string
  shortCode?: string | null
  status: string
  totalAmount: number
  itemsCount: number
}

export function ActiveOrderBanner() {
  const pathname = usePathname()
  const { user, isLoggedIn } = useAuth()
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSummary | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const checkActiveOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams()

      if (!isLoggedIn) {
        let guestIds: string[] = []
        try {
          const storedGuest = localStorage.getItem('snaxy_guest_orders')
          const storedRecent = localStorage.getItem('snaxy_recent_orders')
          const parsed = storedGuest ? JSON.parse(storedGuest) : (storedRecent ? JSON.parse(storedRecent) : [])
          if (Array.isArray(parsed)) guestIds = parsed
        } catch {
          // Ignore
        }

        if (guestIds.length === 0) {
          setActiveOrder(null)
          return
        }

        params.append('ids', guestIds.slice(0, 5).join(','))
      }

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
  }, [isLoggedIn])

  useEffect(() => {
    checkActiveOrders()
    const interval = setInterval(checkActiveOrders, 6000)
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
  const isVerifying = activeOrder.status === ORDER_STATUS.PAYMENT_SUBMITTED
  const isVerified = activeOrder.status === ORDER_STATUS.VERIFIED

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-fade-in-up">
      <div
        className={`p-3.5 sm:p-4 rounded-3xl backdrop-blur-2xl border shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 ${
          isReady
            ? 'bg-emerald-950/90 border-emerald-500/50 ring-2 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
            : isCooking
            ? 'bg-slate-950/95 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.25)]'
            : isVerified
            ? 'bg-slate-950/95 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
            : isVerifying
            ? 'bg-slate-950/95 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
            : 'bg-slate-950/95 border-white/15'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isReady
                ? 'bg-emerald-500/20 border-emerald-500/40 text-xl'
                : isCooking
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                : isVerified
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                : isVerifying
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                : 'bg-primary/20 border-primary/40 text-primary'
            }`}
          >
            {isReady ? (
              <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
            ) : isCooking ? (
              <ChefHat className="w-5 h-5 text-orange-400 animate-pulse" />
            ) : isVerified ? (
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            ) : (
              <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-orange-400 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md">
                {activeOrder.shortCode || `#${activeOrder.id.slice(-6).toUpperCase()}`}
              </span>
              <span
                className={`text-xs font-black truncate ${
                  isReady
                    ? 'text-emerald-300'
                    : isCooking
                    ? 'text-orange-400'
                    : isVerified
                    ? 'text-purple-300'
                    : 'text-white'
                }`}
              >
                {isReady
                  ? 'Your Food is Ready!'
                  : isCooking
                  ? 'Cooking on Grill'
                  : isVerified
                  ? 'Payment Verified'
                  : 'Verifying Payment'}
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
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : isCooking
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:opacity-95 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
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
