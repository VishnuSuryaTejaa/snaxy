import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, Package, MapPin, XCircle, ChefHat, Bell, Sparkles, ArrowRight, Utensils } from 'lucide-react'
import Link from 'next/link'
import { ORDER_STATUS, OrderStatusType } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface StatusStep {
  key: OrderStatusType[]
  label: string
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
  emoji: string
  color: string
}

const STATUS_STEPS: StatusStep[] = [
  {
    key: [ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED],
    label: 'Payment Submitted',
    sublabel: 'Kitchen staff is verifying the transaction',
    icon: Clock,
    emoji: '💳',
    color: 'text-amber-400',
  },
  {
    key: [ORDER_STATUS.VERIFIED],
    label: 'Payment Confirmed',
    sublabel: 'Payment verified! Order queued in kitchen',
    icon: CheckCircle2,
    emoji: '✅',
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

const TERMINAL_BAD: OrderStatusType[] = [ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED]

function getStepIndex(status: OrderStatusType): number {
  return STATUS_STEPS.findIndex((s) => s.key.includes(status))
}

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { menuItem: true },
      },
    },
  })

  if (!order) notFound()

  const isCancelled = TERMINAL_BAD.includes(order.status as OrderStatusType)
  const activeStep = getStepIndex(order.status as OrderStatusType)
  const isReady = order.status === ORDER_STATUS.READY || order.status === ORDER_STATUS.COMPLETED

  return (
    <div className="flex-1 w-full flex flex-col items-center px-4 sm:px-6 py-10 animate-fade-in pb-20">
      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Top Celebration / Status Banner */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary/20 via-orange-500/20 to-rose-500/20 border border-white/10 shadow-2xl mb-4">
            <span className="text-4xl animate-bounce" style={{ animationDuration: '2.5s' }}>
              {isCancelled ? '❌' : isReady ? '🎉' : '🔥'}
            </span>
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-primary to-rose-500 opacity-20 blur-lg animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-heading">
            {isCancelled ? 'Order Cancelled' : isReady ? 'Your Order is Ready!' : 'Preparing Your Bites'}
          </h1>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs font-bold text-slate-400">Order Ref:</span>
            <span className="font-mono font-black text-xs text-orange-400 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg">
              {order.shortCode || `#${order.id.slice(-6).toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* Live Milestone Progress Timeline */}
        {!isCancelled && (
          <div className="rounded-3xl glass-card border border-white/[0.08] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/[0.08]">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-heading">
                Kitchen Tracker
              </h2>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Status
              </span>
            </div>

            <div className="flex flex-col">
              {STATUS_STEPS.map((step, i) => {
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

                      {i < STATUS_STEPS.length - 1 && (
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
                        className={`font-black text-sm font-heading ${
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

        {/* Cancelled Notice */}
        {isCancelled && (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-950/30 p-6 flex items-center gap-4 shadow-xl">
            <XCircle className="h-8 w-8 text-rose-400 shrink-0" />
            <div>
              <p className="font-extrabold text-rose-400 text-base font-heading">Order {order.status}</p>
              <p className="text-xs text-slate-300 mt-1">
                Please contact staff at the counter or show your transaction UTR.
              </p>
            </div>
          </div>
        )}

        {/* Order Summary Receipt Box */}
        <div className="rounded-3xl glass-card border border-white/[0.08] p-6 shadow-2xl flex flex-col gap-4">
          <h2 className="font-black text-xs uppercase tracking-wider text-slate-400 font-heading pb-2 border-b border-white/[0.08]">
            Items Ordered
          </h2>

          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="text-white font-black bg-white/[0.06] px-2 py-0.5 rounded-lg text-xs font-mono">
                    {item.quantity}×
                  </span>{' '}
                  {item.menuItem.name}
                </span>
                <span className="font-bold text-white font-mono">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-center font-black border-t border-white/[0.08] pt-4 text-white">
            <span className="text-sm font-heading">Grand Total</span>
            <span className="text-2xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">
              ₹{order.totalAmount.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Customer & Location Details */}
        <div className="rounded-3xl glass-card border border-white/[0.08] p-6 shadow-2xl flex flex-col gap-3 text-xs">
          <h2 className="font-black text-xs uppercase tracking-wider text-slate-400 font-heading pb-2 border-b border-white/[0.08]">
            Delivery Info
          </h2>
          <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-3 items-center">
            <span className="text-slate-400 font-bold">Recipient</span>
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
                <span className="text-slate-400 font-bold">Spot</span>
                <span className="font-semibold text-white">{order.deliveryAddress}</span>
              </>
            )}

            {order.upiUtr && (
              <>
                <span className="text-slate-400 font-bold">UPI UTR</span>
                <span className="font-mono text-xs bg-black/40 border border-white/10 text-orange-300 rounded-lg px-2.5 py-1 w-fit font-bold">
                  {order.upiUtr}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Back to Home Button */}
        <Link
          href="/#menu"
          className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white font-extrabold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          <Utensils className="w-4 h-4 text-primary" />
          <span>Order More Snacks</span>
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Link>
      </div>
    </div>
  )
}
