'use client'

import { useState, useEffect } from 'react'
import { Order } from '@/types'
import {
  CheckCircle2,
  ChefHat,
  Bell,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  X,
  Clock,
  Phone,
  Save,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { ORDER_STATUS } from '@/lib/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'

// Unified Color Psychology for Admin Kitchen Staff
const STATUS_CONFIG: Record<string, { label: string; color: string; border: string; dot: string; glow: string }> = {
  [ORDER_STATUS.AWAITING_PAYMENT]: {
    label: 'Awaiting Payment',
    color: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    border: 'border-l-amber-500',
    dot: 'bg-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
  },
  [ORDER_STATUS.PAYMENT_SUBMITTED]: {
    label: 'Verifying Payment',
    color: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    border: 'border-l-blue-500',
    dot: 'bg-blue-400 animate-pulse',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.25)]',
  },
  [ORDER_STATUS.VERIFIED]: {
    label: 'Payment Verified',
    color: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    border: 'border-l-purple-500',
    dot: 'bg-purple-400',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]',
  },
  [ORDER_STATUS.PREPARING]: {
    label: 'Cooking on Grill',
    color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    border: 'border-l-orange-500',
    dot: 'bg-orange-500 animate-ping',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
  },
  [ORDER_STATUS.READY]: {
    label: 'Food Ready!',
    color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    border: 'border-l-emerald-500',
    dot: 'bg-emerald-400 animate-pulse',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
  },
  [ORDER_STATUS.COMPLETED]: {
    label: 'Completed / Delivered',
    color: 'bg-slate-800/60 text-slate-400 border border-white/10',
    border: 'border-l-slate-600',
    dot: 'bg-slate-500',
    glow: '',
  },
  [ORDER_STATUS.REJECTED]: {
    label: 'Payment Rejected',
    color: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    border: 'border-l-rose-500',
    dot: 'bg-rose-500',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.25)]',
  },
  [ORDER_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    border: 'border-l-rose-500',
    dot: 'bg-rose-500',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.25)]',
  },
}

const ETA_PRESETS = ['10 mins', '15 mins', '20 mins', '30 mins', '45 mins']

export function AdminOrderCard({
  order,
  idx,
  updateOrderStatus,
}: {
  order: Order
  idx: number
  updateOrderStatus: (
    orderId: string,
    status?: string,
    extra?: { deliveryContactPhone?: string | null; estimatedTime?: string | null }
  ) => Promise<boolean> | void
}) {
  const c = STATUS_CONFIG[order.status] ?? STATUS_CONFIG[ORDER_STATUS.PAYMENT_SUBMITTED]
  const [copiedUtr, setCopiedUtr] = useState(false)
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)

  // Local state for custom delivery phone and ETA
  const [estimatedTime, setEstimatedTime] = useState(order.estimatedTime || '')
  const [deliveryContactPhone, setDeliveryContactPhone] = useState(order.deliveryContactPhone || '')
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    setEstimatedTime(order.estimatedTime || '')
    setDeliveryContactPhone(order.deliveryContactPhone || '')
  }, [order.estimatedTime, order.deliveryContactPhone])

  const shortId = order.shortCode || `#${order.id.slice(-6).toUpperCase()}`

  const handleCopyUtr = async () => {
    if (!order.upiUtr) return
    await navigator.clipboard.writeText(order.upiUtr)
    setCopiedUtr(true)
    setTimeout(() => setCopiedUtr(false), 2000)
  }

  const handleSaveDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSavingDetails(true)
    try {
      const ok = await updateOrderStatus(order.id, undefined, {
        deliveryContactPhone: deliveryContactPhone.trim() || null,
        estimatedTime: estimatedTime.trim() || null,
      })
      if (ok !== false) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 2500)
      }
    } finally {
      setIsSavingDetails(false)
    }
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
              <span className="font-mono text-xs font-black text-orange-400 bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5">
                {shortId}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-black rounded-full px-2.5 py-0.5 ${c.color} ${c.glow}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {c.label}
              </span>
              {order.paymentMethod === 'cash' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold rounded-full px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  💵 CASH ON DELIVERY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/20">
                  📱 UPI QR Pay
                </span>
              )}
              {order.estimatedTime && (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold rounded-full px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {order.estimatedTime}
                </span>
              )}
              {order.deliveryContactPhone && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/20">
                  <Phone className="w-3 h-3 text-purple-400" />
                  {order.deliveryContactPhone}
                </span>
              )}
            </div>
            <p className="font-bold text-base leading-tight">{order.customerName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans">
              📞 <a href={`tel:${order.customerPhone}`} className="hover:text-primary transition">{order.customerPhone}</a>
              {' · '}
              {order.deliveryType === 'delivery' ? '🛵 Delivery' : '🛍️ Pickup'}
              {order.deliveryAddress && ` · ${order.deliveryAddress}`}
            </p>
          </div>
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400 font-display text-xl shrink-0 ml-2">
            ₹{order.totalAmount.toFixed(0)}
          </span>
        </div>

        {/* Fraud / Duplicate UTR Warning Banner */}
        {order.duplicateUtrFlag && (
          <div className="bg-rose-500/15 border-y border-rose-500/30 px-4 py-2 flex items-center gap-2 text-xs font-bold text-rose-400 animate-pulse font-sans">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>FRAUD ALERT: Duplicate UTR used on another order!</span>
          </div>
        )}

        {/* Items List */}
        <div className="px-4 py-3 flex-1 font-sans">
          <ul className="space-y-1.5">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground">{item.quantity}×</span> {item.menuItem.name}
                </span>
                <span className="text-muted-foreground font-mono font-semibold">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>

          {/* Payment Details Section */}
          <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-2">
            {order.paymentMethod === 'cash' ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-400/80 uppercase font-bold tracking-wider">Payment Mode</p>
                  <p className="text-xs font-black text-emerald-300">CASH ON DELIVERY</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-400/80 uppercase font-bold tracking-wider">Collect Cash</p>
                  <p className="text-sm font-black text-emerald-400 font-display">₹{order.totalAmount.toFixed(0)}</p>
                </div>
              </div>
            ) : order.upiUtr ? (
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

          {/* Custom Delivery Phone & ETA Configuration for this Order */}
          <div className="mt-3 pt-3 border-t border-white/[0.06] bg-black/20 p-3 rounded-xl border border-white/[0.04] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-wide text-slate-300 uppercase flex items-center gap-1.5 font-display">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Order ETA &amp; Runner Contact</span>
              </span>
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={isSavingDetails}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-orange-300 transition-all active:scale-95 flex items-center gap-1"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-extrabold">Saved ✓</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    <span>Save Info</span>
                  </>
                )}
              </button>
            </div>

            {/* Estimated Prep/Delivery Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Estimated Time (ETA)</span>
                </label>
              </div>
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1 mb-1.5">
                {ETA_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEstimatedTime(preset)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                      estimatedTime === preset
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white border-white/10'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g. 15 mins or 10:30 PM"
                className="w-full text-xs bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary/60 font-sans"
              />
            </div>

            {/* Delivery Runner / Kitchen Contact Mobile */}
            <div>
              <label className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3 text-purple-400" />
                <span>Runner / Kitchen Phone</span>
              </label>
              <input
                type="tel"
                value={deliveryContactPhone}
                onChange={(e) => setDeliveryContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g. 9876543210"
                className="w-full text-xs font-mono bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary/60"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4 flex flex-col gap-2 font-sans">
          {order.status === ORDER_STATUS.PAYMENT_SUBMITTED && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  updateOrderStatus(order.id, ORDER_STATUS.VERIFIED, {
                    deliveryContactPhone: deliveryContactPhone.trim() || null,
                    estimatedTime: estimatedTime.trim() || null,
                  })
                }
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500 hover:text-white text-xs font-bold py-2.5 transition-all active:scale-95 shadow-sm"
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
              onClick={() =>
                updateOrderStatus(order.id, ORDER_STATUS.PREPARING, {
                  deliveryContactPhone: deliveryContactPhone.trim() || null,
                  estimatedTime: estimatedTime.trim() || null,
                })
              }
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white text-xs font-bold py-2.5 transition-all active:scale-95 shadow-md"
            >
              <ChefHat className="w-4 h-4" /> Start Cooking
            </button>
          )}

          {order.status === ORDER_STATUS.PREPARING && (
            <button
              onClick={() =>
                updateOrderStatus(order.id, ORDER_STATUS.READY, {
                  deliveryContactPhone: deliveryContactPhone.trim() || null,
                  estimatedTime: estimatedTime.trim() || null,
                })
              }
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-white text-xs font-bold py-2.5 transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Bell className="w-4 h-4 animate-bounce" /> Mark Ready for Pickup / Delivery
            </button>
          )}

          {order.status === ORDER_STATUS.READY && (
            <button
              onClick={() =>
                updateOrderStatus(order.id, ORDER_STATUS.COMPLETED, {
                  deliveryContactPhone: deliveryContactPhone.trim() || null,
                  estimatedTime: estimatedTime.trim() || null,
                })
              }
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/15 text-slate-200 text-xs font-bold py-2.5 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Complete Order
            </button>
          )}

          {/* Fallback Dropdown */}
          <Select
            value={order.status}
            onValueChange={(val) => {
              if (val)
                updateOrderStatus(order.id, val, {
                  deliveryContactPhone: deliveryContactPhone.trim() || null,
                  estimatedTime: estimatedTime.trim() || null,
                })
            }}
          >
            <SelectTrigger className="h-8 text-xs rounded-xl border-white/10 bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ORDER_STATUS.AWAITING_PAYMENT}>Awaiting Payment</SelectItem>
              <SelectItem value={ORDER_STATUS.PAYMENT_SUBMITTED}>Pending Verify</SelectItem>
              <SelectItem value={ORDER_STATUS.VERIFIED}>Verified</SelectItem>
              <SelectItem value={ORDER_STATUS.PREPARING}>Cooking / Preparing</SelectItem>
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
              <h3 className="font-bold text-sm font-display">Payment Screenshot — {shortId}</h3>
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
