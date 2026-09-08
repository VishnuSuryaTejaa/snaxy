import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, Package, MapPin, XCircle, ChefHat, Bell } from 'lucide-react'
import Link from 'next/link'
import { ORDER_STATUS, OrderStatusType } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface StatusStep {
  key: OrderStatusType[]
  label: string
  icon: React.ComponentType<{ className?: string }>
  emoji: string
  color: string
}

const STATUS_STEPS: StatusStep[] = [
  { key: [ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.PAYMENT_SUBMITTED], label: 'Payment Submitted', icon: Clock, emoji: '💳', color: 'text-blue-400' },
  { key: [ORDER_STATUS.VERIFIED],                   label: 'Payment Verified',  icon: CheckCircle2, emoji: '✅', color: 'text-purple-400' },
  { key: [ORDER_STATUS.PREPARING],                  label: 'Preparing',         icon: ChefHat, emoji: '👨‍🍳', color: 'text-orange-400' },
  { key: [ORDER_STATUS.READY, ORDER_STATUS.COMPLETED],         label: 'Ready!',            icon: Bell, emoji: '🔔', color: 'text-green-400' },
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
        include: { menuItem: true }
      }
    }
  })

  if (!order) notFound()

  const isCancelled = TERMINAL_BAD.includes(order.status as OrderStatusType)
  const activeStep = getStepIndex(order.status as OrderStatusType)
  const isReady = order.status === ORDER_STATUS.READY || order.status === ORDER_STATUS.COMPLETED

  return (
    <div className="flex-1 w-full flex flex-col items-center px-4 py-10 animate-fade-in">
      <div className="w-full max-w-lg flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">
            {isCancelled ? '❌' : isReady ? '🎉' : '⏳'}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isCancelled ? 'Order Cancelled' : isReady ? 'Order Ready!' : 'Tracking Order'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Order Progress</h2>
            <div className="flex flex-col gap-0">
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon
                const done = i < activeStep
                const active = i === activeStep
                const future = i > activeStep

                return (
                  <div key={i} className="flex items-start gap-4">
                    {/* Dot + line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0 ${
                        done
                          ? 'bg-primary border-primary text-primary-foreground'
                          : active
                          ? 'bg-primary/15 border-primary animate-pulse-dot'
                          : 'bg-muted/30 border-muted text-muted-foreground'
                      }`}>
                        {done ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground/40'}`} />
                        )}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-10 rounded-full mt-0.5 transition-all duration-700 ${
                          done ? 'bg-primary' : 'bg-muted/40'
                        }`} />
                      )}
                    </div>

                    {/* Label */}
                    <div className={`pt-2.5 pb-6 transition-all ${future ? 'opacity-30' : ''}`}>
                      <p className={`font-bold text-sm ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                        {active && <span className="ml-2 text-xs animate-pulse-dot inline-block">●</span>}
                      </p>
                      {active && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {i === 0 && 'Waiting for payment verification...'}
                          {i === 1 && 'Your payment has been confirmed!'}
                          {i === 2 && 'Kitchen is preparing your order...'}
                          {i === 3 && 'Come collect your order! 🎊'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cancelled notice */}
        {isCancelled && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-red-400">Order {order.status}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Please contact our staff for assistance.</p>
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="rounded-2xl border border-white/[0.07] bg-card p-5 flex flex-col gap-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Order Summary</h2>

          <ul className="space-y-2.5">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  <span className="text-foreground font-semibold">{item.quantity}×</span> {item.menuItem.name}
                </span>
                <span className="font-semibold">₹{(item.price * item.quantity).toFixed(0)}</span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between font-extrabold border-t border-white/[0.07] pt-3 text-primary">
            <span>Total</span>
            <span>₹{order.totalAmount.toFixed(0)}</span>
          </div>
        </div>

        {/* Delivery details */}
        <div className="rounded-2xl border border-white/[0.07] bg-card p-5 flex flex-col gap-3 text-sm">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Details</h2>
          <div className="grid grid-cols-[90px_1fr] gap-y-2 gap-x-3">
            <span className="text-muted-foreground">Name</span>
            <span className="font-semibold">{order.customerName}</span>

            <span className="text-muted-foreground">Phone</span>
            <span className="font-semibold">{order.customerPhone}</span>

            <span className="text-muted-foreground">Type</span>
            <span className="font-semibold flex items-center gap-1.5">
              {order.deliveryType === 'delivery' ? (
                <><MapPin className="h-3.5 w-3.5 text-primary" /> Delivery</>
              ) : (
                <><Package className="h-3.5 w-3.5 text-primary" /> Pick Up</>
              )}
            </span>

            {order.deliveryAddress && (
              <>
                <span className="text-muted-foreground">Location</span>
                <span className="font-semibold">{order.deliveryAddress}</span>
              </>
            )}

            {order.upiUtr && (
              <>
                <span className="text-muted-foreground">UTR</span>
                <span className="font-mono text-xs bg-muted/40 rounded px-2 py-0.5 w-fit">{order.upiUtr}</span>
              </>
            )}
          </div>
        </div>

        {/* Back link */}
        <Link
          href="/"
          className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Menu
        </Link>

      </div>
    </div>
  )
}
