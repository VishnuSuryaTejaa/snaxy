'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  XCircle,
  MapPin,
  RefreshCw,
  Search,
  ArrowRight,
  Utensils,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { ORDER_STATUS, OrderStatusType } from '@/lib/constants'
import { toast } from 'sonner'

export interface UserOrder {
  id: string
  shortCode?: string | null
  customerName: string
  customerPhone: string
  deliveryType: string
  deliveryAddress?: string | null
  orderNotes?: string | null
  totalAmount: number
  paymentMethod: string
  status: string
  upiUtr?: string | null
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    menuItem: {
      id: string
      name: string
      price: number
      imageUrl?: string | null
      isVeg: boolean
      category?: string
    }
  }>
}

interface StepMilestone {
  key: OrderStatusType[]
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ORDER_STEPS: StepMilestone[] = [
  {
    key: [ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED],
    label: 'Submitted',
    icon: Clock,
  },
  {
    key: [ORDER_STATUS.VERIFIED],
    label: 'Verified',
    icon: CheckCircle2,
  },
  {
    key: [ORDER_STATUS.PREPARING],
    label: 'Cooking',
    icon: ChefHat,
  },
  {
    key: [ORDER_STATUS.READY, ORDER_STATUS.COMPLETED],
    label: 'Ready',
    icon: Bell,
  },
]

function getOrderStepIndex(status: string): number {
  return ORDER_STEPS.findIndex((s) => s.key.includes(status as OrderStatusType))
}

function getStatusBadge(status: string) {
  switch (status) {
    case ORDER_STATUS.AWAITING_PAYMENT:
      return {
        label: 'Awaiting Payment',
        color: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        dot: 'bg-amber-400',
        emoji: '💳',
      }
    case ORDER_STATUS.PAYMENT_SUBMITTED:
      return {
        label: 'Verifying Payment',
        color: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
        dot: 'bg-orange-400 animate-pulse',
        emoji: '⏳',
      }
    case ORDER_STATUS.VERIFIED:
      return {
        label: 'Payment Verified',
        color: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
        dot: 'bg-purple-400',
        emoji: '✅',
      }
    case ORDER_STATUS.PREPARING:
      return {
        label: 'Cooking on Grill',
        color: 'bg-primary/20 border-primary/40 text-orange-400',
        dot: 'bg-primary animate-ping',
        emoji: '👨‍🍳',
      }
    case ORDER_STATUS.READY:
      return {
        label: 'Food Hot & Ready!',
        color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        dot: 'bg-emerald-400 animate-pulse',
        emoji: '🔔',
      }
    case ORDER_STATUS.COMPLETED:
      return {
        label: 'Delivered / Completed',
        color: 'bg-slate-800/60 border-white/10 text-slate-400',
        dot: 'bg-slate-500',
        emoji: '📦',
      }
    case ORDER_STATUS.REJECTED:
    case ORDER_STATUS.CANCELLED:
      return {
        label: status === ORDER_STATUS.REJECTED ? 'Payment Rejected' : 'Order Cancelled',
        color: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        dot: 'bg-rose-500',
        emoji: '❌',
      }
    default:
      return {
        label: status,
        color: 'bg-slate-800/60 border-white/10 text-slate-400',
        dot: 'bg-slate-500',
        emoji: '🍽️',
      }
  }
}

function playReadyAlert() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.1)
      gain.gain.setValueAtTime(0.3, now + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.1)
      osc.stop(now + i * 0.1 + 0.35)
    })
  } catch {
    // Audio restriction fallback
  }
}

export function MyOrdersClient() {
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchPhone, setSearchPhone] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'past'>('all')
  const prevStatusesRef = useRef<Record<string, string>>({})

  const fetchOrders = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true)
    try {
      // Collect IDs from localStorage
      let localIds: string[] = []
      let lastPhone = ''
      try {
        localIds = JSON.parse(localStorage.getItem('snaxy_recent_orders') || '[]')
        lastPhone = localStorage.getItem('snaxy_last_phone') || ''
      } catch {
        // Ignore
      }

      const phoneToQuery = searchPhone.trim() || lastPhone

      const params = new URLSearchParams()
      if (phoneToQuery && phoneToQuery.length === 10) {
        params.append('phone', phoneToQuery)
      }
      if (localIds.length > 0) {
        params.append('ids', localIds.slice(0, 30).join(','))
      }

      const res = await fetch(`/api/user/orders?${params.toString()}`)
      const data = await res.json()

      if (data.success && Array.isArray(data.orders)) {
        // Check if any order transitioned to READY
        data.orders.forEach((o: UserOrder) => {
          const oldStatus = prevStatusesRef.current[o.id]
          if (oldStatus && oldStatus !== o.status && o.status === ORDER_STATUS.READY) {
            playReadyAlert()
            toast.success(`🎉 Order ${o.shortCode || ''} is READY for pickup!`)
          }
          prevStatusesRef.current[o.id] = o.status
        })

        setOrders(data.orders)
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
      if (manual) setTimeout(() => setIsRefreshing(false), 500)
    }
  }, [searchPhone])

  useEffect(() => {
    // Initial auto-populate search phone if stored
    try {
      const storedPhone = localStorage.getItem('snaxy_last_phone')
      if (storedPhone && storedPhone.length === 10) {
        setSearchPhone(storedPhone)
      }
    } catch {
      // Ignore
    }

    fetchOrders()
  }, [fetchOrders])

  // Polling every 5s for live status updates if there are active orders
  useEffect(() => {
    const hasActiveOrders = orders.some(
      (o) =>
        o.status !== ORDER_STATUS.COMPLETED &&
        o.status !== ORDER_STATUS.CANCELLED &&
        o.status !== ORDER_STATUS.REJECTED
    )

    if (!hasActiveOrders) return

    const interval = setInterval(() => {
      fetchOrders(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [orders, fetchOrders])

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchPhone.trim().length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }
    try {
      localStorage.setItem('snaxy_last_phone', searchPhone.trim())
    } catch {
      // Ignore
    }
    setLoading(true)
    fetchOrders(true)
  }

  const activeOrders = orders.filter(
    (o) =>
      o.status !== ORDER_STATUS.COMPLETED &&
      o.status !== ORDER_STATUS.CANCELLED &&
      o.status !== ORDER_STATUS.REJECTED
  )

  const pastOrders = orders.filter(
    (o) =>
      o.status === ORDER_STATUS.COMPLETED ||
      o.status === ORDER_STATUS.CANCELLED ||
      o.status === ORDER_STATUS.REJECTED
  )

  const displayedOrders =
    activeTab === 'active'
      ? activeOrders
      : activeTab === 'past'
      ? pastOrders
      : orders

  return (
    <div className="relative flex-1 w-full flex flex-col items-center px-4 sm:px-6 py-8 animate-fade-in pb-24">
      {/* Ambient glowing background meshes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-1/3 w-[700px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-rose-500/10 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-bold text-orange-300 mb-2 shadow-[0_0_15px_rgba(255,94,14,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Real-Time Kitchen Sync</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display">
              My Orders &amp; Live Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
              Monitor your snacks cooking in the kitchen and review past campus bites.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => fetchOrders(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="Refresh live statuses"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>

            <Link
              href="/#menu"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-primary to-rose-500 hover:opacity-95 text-white text-xs font-black transition-all active:scale-95 shadow-[0_0_20px_rgba(255,94,14,0.4)] border border-white/20 font-display"
            >
              <Utensils className="h-3.5 w-3.5" />
              <span>Order Snacks</span>
            </Link>
          </div>
        </div>

        {/* Search by Mobile Phone */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl">
          <form onSubmit={handlePhoneSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                placeholder="Search orders by 10-digit mobile number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs sm:text-sm font-mono shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/[0.08] hover:bg-primary hover:text-white border border-white/10 text-slate-200 text-xs font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <span>Search Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-primary to-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-primary to-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {activeOrders.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <span>Live Kitchen ({activeOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'past'
                ? 'bg-gradient-to-r from-primary to-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History ({pastOrders.length})
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 rounded-3xl bg-slate-950/60 border border-white/[0.06] gap-3">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-slate-400 font-bold font-sans">Connecting to Snaxy kitchen records...</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 sm:p-16 rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/[0.08] text-center shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl mb-4 shadow-[0_0_25px_rgba(255,94,14,0.3)]">
              🛍️
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-display mb-1">
              No Orders Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
              {searchPhone
                ? `No orders linked with mobile number ${searchPhone}. Search with another number or place a new order!`
                : 'You haven’t placed any orders from this device yet. Explore the menu to grab fresh campus snacks!'}
            </p>
            <Link
              href="/#menu"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white text-xs font-extrabold shadow-[0_0_25px_rgba(255,94,14,0.4)] transition-all hover:scale-105 active:scale-95 border border-white/20 font-display flex items-center gap-2"
            >
              <Utensils className="h-4 w-4" />
              <span>Explore Delicious Bites</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {displayedOrders.map((order, idx) => {
              const badge = getStatusBadge(order.status)
              const stepIndex = getOrderStepIndex(order.status)
              const isTerminalBad =
                order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REJECTED
              const isAwaitingPayment = order.status === ORDER_STATUS.AWAITING_PAYMENT
              const isReady = order.status === ORDER_STATUS.READY

              return (
                <div
                  key={order.id}
                  className={`rounded-3xl bg-slate-950/80 backdrop-blur-2xl border transition-all duration-300 overflow-hidden shadow-2xl animate-fade-in-up stagger-${Math.min(
                    idx + 1,
                    5
                  )} ${
                    isReady
                      ? 'border-emerald-500/50 ring-2 ring-emerald-500/20'
                      : 'border-white/[0.08] hover:border-primary/40'
                  }`}
                >
                  {/* Top Bar: Reference & Status */}
                  <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans">
                          Order Reference
                        </span>
                        <span className="font-mono font-black text-sm text-orange-400 bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-lg w-fit mt-0.5 shadow-sm">
                          {order.shortCode || `#${order.id.slice(-6).toUpperCase()}`}
                        </span>
                      </div>
                      <div className="h-7 w-px bg-white/10 hidden sm:block" />
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        {new Date(order.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status pill */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${badge.color}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
                        <span>{badge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Milestone Progress Bar (Only for non-cancelled orders) */}
                  {!isTerminalBad && (
                    <div className="px-5 sm:px-6 pt-5 pb-2 border-b border-white/[0.06] bg-black/20">
                      <div className="relative flex items-center justify-between font-sans">
                        <div className="absolute top-[14px] left-[10%] right-[10%] h-0.5 bg-white/10" />
                        <div
                          className="absolute top-[14px] left-[10%] h-0.5 bg-gradient-to-r from-primary to-rose-500 transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, (stepIndex / (ORDER_STEPS.length - 1)) * 80)
                            )}%`,
                          }}
                        />

                        {ORDER_STEPS.map((step, sIdx) => {
                          const done = sIdx < stepIndex
                          const active = sIdx === stepIndex
                          const Icon = step.icon

                          return (
                            <div
                              key={sIdx}
                              className="flex flex-col items-center flex-1 relative gap-1.5 z-10"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
                                  done
                                    ? 'bg-gradient-to-r from-primary to-rose-500 border-transparent text-white shadow-md'
                                    : active
                                    ? 'bg-slate-900 border-primary text-primary scale-110 shadow-[0_0_15px_rgba(255,94,14,0.5)]'
                                    : 'bg-slate-900 border-white/10 text-slate-600 opacity-60'
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                                ) : (
                                  <Icon className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-bold ${
                                  active
                                    ? 'text-orange-400 font-black'
                                    : done
                                    ? 'text-white'
                                    : 'text-slate-500 opacity-60'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Body Details */}
                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    {/* Items List */}
                    <div className="flex-1 flex flex-col gap-2.5">
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs"
                          >
                            <span className="font-mono font-bold text-orange-400">
                              {item.quantity}×
                            </span>
                            <span className="font-medium text-slate-200">
                              {item.menuItem?.name || 'Snack Item'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Location & Customer Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-sans">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <strong className="text-slate-300">Spot:</strong>{' '}
                          {order.deliveryAddress || 'Campus Spot'}
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-slate-300">For:</strong> {order.customerName}
                        </span>
                      </div>
                    </div>

                    {/* Total & Action Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 font-sans block">
                          Total Amount
                        </span>
                        <span className="text-2xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">
                          ₹{order.totalAmount.toFixed(0)}
                        </span>
                      </div>

                      {isAwaitingPayment ? (
                        <Link
                          href={`/checkout?order=${order.id}`}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white text-xs font-black transition-all active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-white/20 font-display"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Complete Payment</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/order/${order.id}`}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95 border font-display ${
                            isReady
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-white/20 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce'
                              : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/10 hover:border-primary/50'
                          }`}
                        >
                          <span>Track Live Status</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
