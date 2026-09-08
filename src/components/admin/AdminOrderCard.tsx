'use client'

import { useState } from 'react'
import { Order } from '@/types'
import { CheckCircle2, ChefHat, Bell, XCircle, AlertTriangle, Copy, Check, Eye, X } from 'lucide-react'
import { ORDER_STATUS } from '@/lib/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string; dot: string }> = {
  [ORDER_STATUS.AWAITING_PAYMENT]: { label: 'Awaiting Payment', color: 'bg-amber-500/15 text-amber-400', border: 'border-l-amber-500', dot: 'bg-amber-400' },
  [ORDER_STATUS.PAYMENT_SUBMITTED]: { label: 'Pending Verify', color: 'bg-status-pending/15 text-status-pending-fg', border: 'border-l-status-pending', dot: 'bg-status-pending' },
  [ORDER_STATUS.VERIFIED]: { label: 'Verified', color: 'bg-status-verified/15 text-status-verified-fg', border: 'border-l-status-verified', dot: 'bg-status-verified' },
  [ORDER_STATUS.PREPARING]: { label: 'Preparing', color: 'bg-status-preparing/15 text-status-preparing-fg', border: 'border-l-status-preparing', dot: 'bg-status-preparing' },
  [ORDER_STATUS.READY]: { label: 'Ready!', color: 'bg-status-ready/15 text-status-ready-fg', border: 'border-l-status-ready', dot: 'bg-status-ready' },
  [ORDER_STATUS.COMPLETED]: { label: 'Completed', color: 'bg-emerald-500/15 text-emerald-400', border: 'border-l-emerald-500', dot: 'bg-emerald-400' },
  [ORDER_STATUS.REJECTED]: { label: 'Rejected', color: 'bg-status-cancelled/15 text-status-cancelled-fg', border: 'border-l-status-cancelled', dot: 'bg-status-cancelled' },
  [ORDER_STATUS.CANCELLED]: { label: 'Cancelled', color: 'bg-status-cancelled/15 text-status-cancelled-fg', border: 'border-l-status-cancelled', dot: 'bg-status-cancelled' },
}

export function AdminOrderCard({
  order,
  idx,
  updateOrderStatus,
}: {
  order: Order
  idx: number
  updateOrderStatus: (orderId: string, status: string) => void
}) {
  const c = STATUS_CONFIG[order.status] ?? STATUS_CONFIG[ORDER_STATUS.PAYMENT_SUBMITTED]
  const [copiedUtr, setCopiedUtr] = useState(false)
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)

  const shortId = order.shortCode || `#${order.id.slice(-6).toUpperCase()}`

  const handleCopyUtr = async () => {
    if (!order.upiUtr) return
    await navigator.clipboard.writeText(order.upiUtr)
    setCopiedUtr(true)
    setTimeout(() => setCopiedUtr(false), 2000)
  }

  return (
    <>
      <div
        className={`flex flex-col rounded-2xl border border-white/[0.07] bg-card border-l-[4px] ${c.border} animate-fade-in-up stagger-${Math.min(
          idx + 1,
          5
        )} hover:border-white/[0.12] transition-all overflow-hidden shadow-lg`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-white/[0.05] bg-muted/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5">
                {shortId}
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-0.5 ${c.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {c.label}
              </span>
            </div>
            <p className="font-bold text-base leading-tight">{order.customerName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              📞 <a href={`tel:${order.customerPhone}`} className="hover:text-primary transition">{order.customerPhone}</a>
              {' · '}
              {order.deliveryType === 'delivery' ? '🛵 Delivery' : '🛍️ Pickup'}
              {order.deliveryAddress && ` · ${order.deliveryAddress}`}
            </p>
          </div>
          <span className="font-extrabold text-primary text-xl shrink-0 ml-2">
            ₹{order.totalAmount.toFixed(0)}
          </span>
        </div>

        {/* Fraud / Duplicate UTR Warning Banner */}
        {order.duplicateUtrFlag && (
          <div className="bg-rose-500/15 border-y border-rose-500/30 px-4 py-2 flex items-center gap-2 text-xs font-bold text-rose-400 animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>FRAUD ALERT: Duplicate UTR used on another order!</span>
          </div>
        )}

        {/* Items List */}
        <div className="px-4 py-3 flex-1">
          <ul className="space-y-1.5">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground">{item.quantity}×</span> {item.menuItem.name}
                </span>
                <span className="text-muted-foreground font-mono">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>

          {/* Payment Details Section */}
          <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-2">
            {order.upiUtr ? (
              <div className="flex items-center justify-between bg-muted/30 px-2.5 py-1.5 rounded-xl border border-white/[0.05]">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">UPI UTR Ref</p>
                  <p className="font-mono text-xs font-bold text-foreground tracking-wide">{order.upiUtr}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUtr}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition"
                  title="Copy UTR"
                >
                  {copiedUtr ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-amber-400/80 font-medium">⏳ No UTR submitted yet</p>
            )}

            {order.payerName && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Payer Name:</span> {order.payerName}
              </p>
            )}

            {/* Screenshot preview button */}
            {order.paymentScreenshot && (
              <button
                type="button"
                onClick={() => setShowScreenshotModal(true)}
                className="w-full mt-1.5 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition"
              >
                <Eye className="h-3.5 w-3.5" /> View Payment Screenshot
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4 flex flex-col gap-2">
          {order.status === ORDER_STATUS.PAYMENT_SUBMITTED && (
            <div className="flex gap-2">
              <button
                onClick={() => updateOrderStatus(order.id, ORDER_STATUS.VERIFIED)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold py-2.5 transition-all active:scale-95 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Verify Payment
              </button>
              <button
                onClick={() => updateOrderStatus(order.id, ORDER_STATUS.REJECTED)}
                className="px-3 flex items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold py-2.5 transition-all active:scale-95"
                title="Reject Payment"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          {order.status === ORDER_STATUS.VERIFIED && (
            <button
              onClick={() => updateOrderStatus(order.id, ORDER_STATUS.PREPARING)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary/15 border border-primary/25 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold py-2.5 transition-all active:scale-95"
            >
              <ChefHat className="w-4 h-4" /> Start Preparing
            </button>
          )}

          {order.status === ORDER_STATUS.PREPARING && (
            <button
              onClick={() => updateOrderStatus(order.id, ORDER_STATUS.READY)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold py-2.5 transition-all active:scale-95"
            >
              <Bell className="w-4 h-4 animate-bounce" /> Mark Ready for Pickup / Delivery
            </button>
          )}

          {order.status === ORDER_STATUS.READY && (
            <button
              onClick={() => updateOrderStatus(order.id, ORDER_STATUS.COMPLETED)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary/15 border border-primary/25 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold py-2.5 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete Order
            </button>
          )}

          {/* Fallback Dropdown */}
          <Select
            value={order.status}
            onValueChange={(val) => {
              if (val) updateOrderStatus(order.id, val)
            }}
          >
            <SelectTrigger className="h-8 text-xs rounded-xl border-white/10 bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ORDER_STATUS.AWAITING_PAYMENT}>Awaiting Payment</SelectItem>
              <SelectItem value={ORDER_STATUS.PAYMENT_SUBMITTED}>Pending Verify</SelectItem>
              <SelectItem value={ORDER_STATUS.VERIFIED}>Verified</SelectItem>
              <SelectItem value={ORDER_STATUS.PREPARING}>Preparing</SelectItem>
              <SelectItem value={ORDER_STATUS.READY}>Ready</SelectItem>
              <SelectItem value={ORDER_STATUS.COMPLETED}>Completed</SelectItem>
              <SelectItem value={ORDER_STATUS.REJECTED}>Rejected</SelectItem>
              <SelectItem value={ORDER_STATUS.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Screenshot Modal */}
      {showScreenshotModal && order.paymentScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowScreenshotModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-card rounded-2xl border border-white/10 p-4 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-sm">Payment Screenshot — {shortId}</h3>
              <button
                onClick={() => setShowScreenshotModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mt-3 w-full h-[60vh] max-h-[500px] rounded-xl overflow-hidden bg-black/40">
              <Image
                src={order.paymentScreenshot}
                alt="Payment Screenshot Full"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="font-mono text-xs text-muted-foreground">UTR: {order.upiUtr || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
