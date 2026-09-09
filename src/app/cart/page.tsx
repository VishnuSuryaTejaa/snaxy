'use client'

import { useCartStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, MapPin, Package, Loader2, Sparkles, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { toast } from 'sonner'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getCartTotal } = useCartStore()
  const mounted = useIsMounted()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    deliveryType: 'pickup',
    address: '',
    notes: '',
  })

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="relative flex-1 w-full flex flex-col items-center justify-center p-6 animate-fade-in min-h-[70vh]">
        {/* Ambient Aurora Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/15 blur-[140px] rounded-full" />
        </div>

        <div className="relative z-10 text-center max-w-sm flex flex-col items-center bg-slate-950/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-white/[0.08] shadow-2xl">
          <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/25 blur-[40px] rounded-full animate-pulse" />
            <ShoppingBag
              className="relative h-16 w-16 text-primary drop-shadow-[0_0_20px_rgba(255,94,14,0.6)] animate-bounce"
              style={{ animationDuration: '3s' }}
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-white font-display">
            Your Tray is Empty
          </h2>
          <p className="text-slate-400 mb-8 text-xs sm:text-sm leading-relaxed font-sans">
            Looks like you haven&apos;t picked any snacks yet. Treat yourself to something fresh and hot!
          </p>
          <Link href="/#menu" className="w-full">
            <Button className="w-full gap-2 rounded-2xl h-12 font-extrabold text-sm bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white shadow-[0_0_25px_rgba(255,94,14,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/20 font-display">
              <span>Explore Delicious Bites</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Please enter your name and phone number')
      return
    }
    if (formData.deliveryType === 'delivery' && !formData.address.trim()) {
      toast.error('Please enter your delivery spot or hostel room')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentMethod: 'upi',
          items: items.map((i) => ({
            id: i.menuItemId || i.id,
            menuItemId: i.menuItemId || i.id,
            quantity: i.quantity,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to initialize order. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Save order metadata in session
      sessionStorage.setItem(
        'snaxy_active_order',
        JSON.stringify({
          orderId: data.orderId,
          shortCode: data.shortCode,
          totalAmount: data.totalAmount,
          customerName: formData.name,
          customerPhone: formData.phone,
          deliveryType: formData.deliveryType,
          items,
        })
      )

      clearCart()
      router.push(`/checkout?order=${data.orderId}`)
    } catch (err) {
      console.error('Checkout initialization error:', err)
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex-1 w-full flex flex-col items-center animate-fade-in pb-20">
      {/* Ambient background light meshes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-1/4 w-[600px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-rose-500/10 blur-[140px] rounded-full pointer-events-none" />
      </div>

      <main className="relative z-10 w-full max-w-6xl px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* ── Left: Cart Items ──────────────────── */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
                Your Tray
              </h1>
              <p className="text-xs text-slate-400 font-semibold mt-0.5 font-sans">
                {items.length} unique {items.length === 1 ? 'item' : 'items'} selected
              </p>
            </div>
            <button
              onClick={clearCart}
              className="text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 active:scale-95 border border-transparent hover:border-rose-500/20 font-sans"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear tray
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex gap-4 p-3.5 sm:p-4 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-white/[0.07] hover:border-primary/30 transition-all duration-300 animate-fade-in-up stagger-${Math.min(
                  idx + 1,
                  5
                )}`}
              >
                {/* Inset Thumbnail */}
                <div className="h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-900/80 flex items-center justify-center border border-white/[0.08] relative">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={80}
                      height={80}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl opacity-50">🍽️</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-display font-bold text-base leading-tight truncate text-white">
                      {item.name}
                    </h4>
                    <span className="font-display font-black text-lg text-white shrink-0">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium font-sans">
                    ₹{item.price.toFixed(0)} each
                  </p>

                  {/* Quantity Stepper */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-xl border border-white/10 bg-black/50 p-0.5 shadow-inner">
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        onClick={() => {
                          if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1)
                          else removeItem(item.id)
                        }}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3 stroke-[2.5]" />
                      </button>
                      <span className="w-7 text-center text-xs font-black text-white font-mono">
                        {item.quantity}
                      </span>
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3 stroke-[2.5]" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal Banner */}
          <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-primary/30 shadow-[0_8px_25px_rgba(255,85,0,0.15)]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 font-sans">
                Total Bill
              </span>
              <p className="text-xs text-slate-400 font-sans">Inclusive of all taxes</p>
            </div>
            <span className="text-3xl font-black text-white font-display tracking-tight">
              ₹{getCartTotal().toFixed(0)}
            </span>
          </div>
        </div>

        {/* ── Right: Delivery & Checkout Form ───────────────── */}
        <div className="w-full lg:w-[400px]">
          <div className="sticky top-28 rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-white/[0.08] bg-white/[0.02]">
              <h2 className="text-lg font-black tracking-tight text-white font-display">
                Customer &amp; Spot Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">We will notify you once food is ready</p>
            </div>

            <form id="checkout-form" onSubmit={handleCheckout} className="px-6 py-5 flex flex-col gap-4 font-sans">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-slate-200">
                  Your Full Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Alex Kumar"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-2xl bg-black/50 border-white/10 focus:border-primary/60 h-11 text-sm text-white font-medium shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-200">
                  Mobile Number (WhatsApp/Call) <span className="text-primary">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  required
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  title="Please enter a valid 10-digit Indian mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className="rounded-2xl bg-black/50 border-white/10 focus:border-primary/60 h-11 text-sm text-white font-medium font-mono shadow-inner"
                />
              </div>

              {/* Delivery type toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Service Option</Label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/50 border border-white/10">
                  {[
                    { value: 'pickup', label: 'Canteen Pickup', icon: Package },
                    { value: 'delivery', label: 'Campus Spot', icon: MapPin },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryType: value })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all duration-200 ${
                        formData.deliveryType === value
                          ? 'bg-gradient-to-r from-primary to-rose-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.deliveryType === 'delivery' && (
                <div className="space-y-1.5 animate-scale-pop">
                  <Label htmlFor="address" className="text-xs font-bold text-slate-200">
                    Location / Hostel Room <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="e.g. Block B Room 304 / Library Lawn"
                    required={formData.deliveryType === 'delivery'}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="rounded-2xl bg-black/50 border-white/10 focus:border-primary/60 h-11 text-sm text-white font-medium shadow-inner"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-bold text-slate-400">
                  Cooking Instructions (Optional)
                </Label>
                <Input
                  id="notes"
                  placeholder="Extra spicy, no mayo, less ice..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="rounded-2xl bg-black/50 border-white/10 focus:border-primary/60 h-11 text-sm text-white font-medium shadow-inner"
                />
              </div>
            </form>

            <div className="px-6 pb-6 pt-1">
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl h-12 bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white font-black text-sm hover:scale-[1.02] transition-all active:scale-[0.98] shadow-[0_0_25px_rgba(255,94,14,0.4)] disabled:opacity-60 border border-white/20 font-display"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Preparing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay ₹{getCartTotal().toFixed(0)}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
