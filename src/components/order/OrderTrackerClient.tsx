'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  XCircle,
  ChefHat,
  Bell,
  Sparkles,
  ArrowRight,
  Utensils,
  RefreshCw,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { ORDER_STATUS, OrderStatusType } from '@/lib/constants'
import { toast } from 'sonner'

interface StatusStep {
  key: OrderStatusType[]
  label: string
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
  emoji: string
  color: string
}

const UPI_STATUS_STEPS: StatusStep[] = [
  {
    key: [ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED],
    label: 'Payment Submitted',
    sublabel: 'Kitchen staff is verifying the transaction',
    icon: Clock,
    emoji: '🏦',
    color: 'text-blue-400',
  },
  {
    key: [ORDER_STATUS.VERIFIED],
    label: 'Payment Verified',
    sublabel: 'Payment confirmed! Order queued in kitchen',
    icon: CheckCircle2,
    emoji: '🛡️',
    color: 'text-purple-400',
  },
  {
    key: [ORDER_STATUS.PREPARING],
    label: 'Cooking on Grill',
    sublabel: 'Fresh ingredients being cooked hot & fresh',
    icon: ChefHat,
    emoji: '👨‍🍳',
    color: 'text-orange-400',
  },
  {
    key: [ORDER_STATUS.READY, ORDER_STATUS.COMPLETED],
    label: 'Ready for Collection!',
    sublabel: 'Come grab your hot tray at the counter',
    icon: Bell,
    emoji: '🔔',
    color: 'text-emerald-400',
  },
]

const COD_STATUS_STEPS: StatusStep[] = [
  {
    key: [ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED, ORDER_STATUS.VERIFIED],
    label: 'Order Confirmed (COD)',
    sublabel: 'Cash on Delivery confirmed — pay upon arrival',
    icon: CheckCircle2,
    emoji: '💵',
    color: 'text-emerald-400',
  },
  {
    key: [ORDER_STATUS.PREPARING],
    label: 'Cooking on Grill',
    sublabel: 'Fresh ingredients being cooked hot & fresh',
    icon: ChefHat,
    emoji: '👨‍🍳',
    color: 'text-orange-400',
  },
  {
    key: [ORDER_STATUS.READY, ORDER_STATUS.COMPLETED],
    label: 'Ready for Collection / Delivery!',
    sublabel: 'Keep exact cash ready for handoff',
    icon: Bell,
    emoji: '🔔',
    color: 'text-emerald-400',
  },
]

const TERMINAL_BAD: OrderStatusType[] = [ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED]
const TERMINAL_DONE: OrderStatusType[] = [ORDER_STATUS.READY, ORDER_STATUS.COMPLETED]

function getStepIndex(status: string, steps: StatusStep[]): number {
  return steps.findIndex((s) => s.key.includes(status as OrderStatusType))
}

function playCelebrationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // Tri-tone chime (C5 -> E5 -> G5)
    const freqs = [523.25, 659.25, 783.99]
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, now + idx * 0.1)
      gain.gain.setValueAtTime(0.3, now + idx * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.1)
      osc.stop(now + idx * 0.1 + 0.4)
    })
  } catch {
    // Graceful fallback
  }
}

export interface SerializedOrder {
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
  deliveryContactPhone?: string | null
  estimatedTime?: string | null
  createdAt: string | Date
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
    }
  }>
}

interface OrderTrackerClientProps {
  initialOrder: SerializedOrder
}

export function OrderTrackerClient({ initialOrder }: OrderTrackerClientProps) {
  const [order, setOrder] = useState<SerializedOrder>(initialOrder)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const prevStatusRef = useRef(initialOrder.status)

  const isCancelled = TERMINAL_BAD.includes(order.status as OrderStatusType)
  const isReady = TERMINAL_DONE.includes(order.status as OrderStatusType)
  const isCod = order.paymentMethod === 'cash' || order.upiUtr === 'CASH ON DELIVERY'
  const steps = isCod ? COD_STATUS_STEPS : UPI_STATUS_STEPS
  const activeStep = getStepIndex(order.status, steps)

  const fetchLiveStatus = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.success && data.order) {
        const newStatus = data.order.status
        if (newStatus !== prevStatusRef.current) {
          prevStatusRef.current = newStatus
          if (newStatus === ORDER_STATUS.READY || newStatus === ORDER_STATUS.COMPLETED) {
            playCelebrationChime()
            toast.success('🎉 Your order is READY! Pick up your bites at the counter!')
          } else if (newStatus === ORDER_STATUS.PREPARING) {
            toast.info('👨‍🍳 The kitchen just started cooking your order!')
          } else if (newStatus === ORDER_STATUS.VERIFIED) {
            toast.success('✅ Payment verified by kitchen!')
          }
        }
        setOrder((prev) => ({
          ...prev,
          ...data.order,
        }))
      }
    } catch (err) {
      console.error('Order status poll error:', err)
    } finally {
      if (manual) setTimeout(() => setIsRefreshing(false), 500)
    }
  }, [order.id])

  useEffect(() => {
    // Stop polling if cancelled or completed
    if (isCancelled || order.status === ORDER_STATUS.COMPLETED) return

    const interval = setInterval(() => {
      fetchLiveStatus(false)
    }, 4000)

    return () => clearInterval(interval)
  }, [isCancelled, order.status, fetchLiveStatus])

  return (
    <div className="flex-1 w-full flex flex-col items-center px-4 sm:px-6 py-10 animate-fade-in pb-24">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col gap-6">
        {/* Top Status Badge & Hero */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary/20 via-orange-500/20 to-rose-500/20 border border-white/10 shadow-2xl mb-4">
            <span className="text-4xl animate-bounce" style={{ animationDuration: '2.5s' }}>
              {isCancelled ? '❌' : isReady ? '🎉' : '🔥'}
            </span>
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-primary to-rose-500 opacity-20 blur-lg animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display">
            {isCancelled
              ? 'Order Cancelled'
              : isReady
              ? 'Your Order is Ready!'
              : order.status === ORDER_STATUS.PREPARING
              ? 'Grilling Your Bites'
              : 'Order in Kitchen'}
          </h1>

          <div className="flex items-center justify-center gap-2 mt-2 font-sans">
            <span className="text-xs font-bold text-slate-400">Order Reference:</span>
            <span className="font-mono font-black text-xs text-orange-400 bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-lg shadow-sm">
              {order.shortCode || `#${order.id.slice(-6).toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* Live ETA & Runner Contact Notice */}
        {!isCancelled && (order.estimatedTime || order.deliveryContactPhone) && (
          <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/30 p-5 sm:p-6 backdrop-blur-2xl shadow-xl flex flex-col gap-3 font-sans animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 font-display">
                Kitchen Live Update
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.estimatedTime && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estimated Time</p>
                    <p className="text-base font-black text-amber-300 font-display">{order.estimatedTime}</p>
                  </div>
                </div>
              )}

              {order.deliveryContactPhone && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Runner / Kitchen</p>
                      <p className="text-xs font-mono font-bold text-purple-300">{order.deliveryContactPhone}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${order.deliveryContactPhone}`}
                    className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Milestone Progress Timeline */}
        {!isCancelled && (
          <div className="rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/[0.08] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/[0.08] font-sans">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 font-display">
                  Live Kitchen Tracker
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
                <button
                  type="button"
                  onClick={() => fetchLiveStatus(true)}
                  disabled={isRefreshing}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title="Check latest status"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex flex-col font-sans">
              {steps.map((step, i) => {
                const Icon = step.icon
                const done = i < activeStep
                const active = i === activeStep
                const future = i > activeStep

                return (
                  <div key={i} className="flex items-start gap-4">
                    {/* Milestone node & connector line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shrink-0 shadow-lg ${
                          done
                            ? 'bg-gradient-to-tr from-primary to-rose-500 border-transparent text-white shadow-[0_0_15px_rgba(255,94,14,0.4)]'
                            : active
                            ? 'bg-slate-900 border-primary text-primary scale-110 shadow-[0_0_20px_rgba(255,94,14,0.6)] animate-pulse'
                            : 'bg-black/40 border-white/10 text-slate-600'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                        ) : (
                          <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-slate-600'}`} />
                        )}
                      </div>

                      {i < steps.length - 1 && (
                        <div
                          className={`w-1 h-12 rounded-full my-1 transition-all duration-700 ${
                            done ? 'bg-gradient-to-b from-primary to-rose-500 shadow-sm' : 'bg-white/10'
                          }`}
                        />
                      )}
                    </div>

                    {/* Milestone Content */}
                    <div className={`pt-2 pb-6 transition-all ${future ? 'opacity-40' : ''}`}>
                      <p
                        className={`font-black text-sm font-display ${
                          active
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400 text-base'
                            : done
                            ? 'text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {step.sublabel}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Ready Banner */}
        {isReady && (
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-950/40 p-6 flex items-center gap-4 shadow-2xl animate-scale-pop">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-2xl">
              🔔
            </div>
            <div>
              <p className="font-black text-emerald-300 text-base font-display">
                Your Food is Hot &amp; Ready!
              </p>
              <p className="text-xs text-slate-200 mt-1 font-sans">
                Head to the Snaxy counter and show Order Code{' '}
                <strong className="text-white font-mono">{order.shortCode}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Cancelled Notice */}
        {isCancelled && (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-950/30 p-6 flex items-center gap-4 shadow-xl font-sans">
            <XCircle className="h-8 w-8 text-rose-400 shrink-0" />
            <div>
              <p className="font-extrabold text-rose-400 text-base font-display">Order {order.status}</p>
              <p className="text-xs text-slate-300 mt-1">
                Please visit the counter with your transaction reference.
              </p>
            </div>
          </div>
        )}

        {/* Order Summary Receipt Box */}
        <div className="rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/[0.08] p-6 shadow-2xl flex flex-col gap-4 font-sans">
          <h2 className="font-black text-xs uppercase tracking-wider text-slate-400 font-display pb-2 border-b border-white/[0.08]">
            Items Ordered
          </h2>

          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="text-white font-black bg-white/[0.06] px-2 py-0.5 rounded-lg text-xs font-mono">
                    {item.quantity}×
                  </span>{' '}
                  <span className="font-semibold text-white">{item.menuItem?.name || 'Snack Item'}</span>
                </span>
                <span className="font-black text-white font-display text-base">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-center font-black border-t border-white/[0.08] pt-4 text-white">
            <span className="text-sm font-display">Grand Total</span>
            <span className="text-2xl font-display text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">
              ₹{order.totalAmount.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Customer & Location Details */}
        <div className="rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/[0.08] p-6 shadow-2xl flex flex-col gap-3 text-xs font-sans">
          <h2 className="font-black text-xs uppercase tracking-wider text-slate-400 font-display pb-2 border-b border-white/[0.08]">
            Delivery &amp; Customer Info
          </h2>
          <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-3 items-center">
            <span className="text-slate-400 font-bold">Customer</span>
            <span className="font-extrabold text-white">{order.customerName}</span>

            <span className="text-slate-400 font-bold">Contact</span>
            <span className="font-mono font-bold text-white">{order.customerPhone}</span>

            <span className="text-slate-400 font-bold">Service</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              {order.deliveryType === 'delivery' ? (
                <>
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Campus Spot
                </>
              ) : (
                <>
                  <Package className="h-3.5 w-3.5 text-primary" /> Canteen Pickup
                </>
              )}
            </span>

            {order.deliveryAddress && (
              <>
                <span className="text-slate-400 font-bold">Spot Location</span>
                <span className="font-semibold text-white">{order.deliveryAddress}</span>
              </>
            )}

            <span className="text-slate-400 font-bold">Payment</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              {isCod ? (
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  💵 Cash on Delivery (Pay ₹{order.totalAmount.toFixed(0)})
                </span>
              ) : (
                <span className="text-blue-400 font-bold flex items-center gap-1">
                  📱 UPI Online Payment
                </span>
              )}
            </span>

            {order.estimatedTime && (
              <>
                <span className="text-slate-400 font-bold">Estimated Time</span>
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {order.estimatedTime}
                </span>
              </>
            )}

            {order.deliveryContactPhone && (
              <>
                <span className="text-slate-400 font-bold">Runner Contact</span>
                <a
                  href={`tel:${order.deliveryContactPhone}`}
                  className="font-mono font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1.5 underline"
                >
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  {order.deliveryContactPhone}
                </a>
              </>
            )}

            {order.upiUtr && !isCod && (
              <>
                <span className="text-slate-400 font-bold">UPI UTR</span>
                <span className="font-mono text-xs bg-black/50 border border-white/10 text-orange-300 rounded-lg px-2.5 py-1 w-fit font-bold">
                  {order.upiUtr}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Back to Home Button */}
        <Link
          href="/#menu"
          className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white font-extrabold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg font-display"
        >
          <Utensils className="w-4 h-4 text-primary" />
          <span>Order More Bites</span>
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Link>
      </div>
    </div>
  )
}
