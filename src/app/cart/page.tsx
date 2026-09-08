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
      <div className="flex-1 w-full flex flex-col items-center justify-center p-8 animate-fade-in min-h-[70vh]">
        <div className="text-center max-w-sm flex flex-col items-center glass p-8 sm:p-10 rounded-3xl border border-white/[0.08] shadow-2xl">
          <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/25 blur-[45px] rounded-full animate-pulse" />
            <ShoppingBag
              className="relative h-20 w-20 text-primary drop-shadow-[0_0_20px_rgba(255,94,14,0.6)] animate-bounce"
              style={{ animationDuration: '3s' }}
            />
            <div
              className="absolute -top-1 -right-1 text-3xl animate-bounce"
              style={{ animationDuration: '2.5s', animationDelay: '0.4s' }}
            >
              🍔
            </div>
            <div
              className="absolute bottom-1 -left-1 text-3xl animate-bounce"
              style={{ animationDuration: '2.2s', animationDelay: '0.2s' }}
            >
              🥤
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-white font-heading">
            Your Cart is Empty
          </h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            Looks like you haven&apos;t picked any snacks yet. Treat yourself to something hot and delicious!
          </p>
          <Link href="/#menu" className="w-full">
            <Button className="w-full gap-2 rounded-2xl h-14 font-extrabold text-base bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white shadow-[0_0_30px_rgba(255,94,14,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/20">
              <span>Explore Delicious Bites</span>
              <ArrowRight className="h-5 w-5" />
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
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
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
    <div className="flex-1 w-full flex flex-col items-center animate-fade-in pb-20">
      <main className="w-full max-w-6xl px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* ── Left: Cart Items ──────────────────── */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white font-heading">
                Your Tray
              </h1>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {items.length} unique {items.length === 1 ? 'item' : 'items'} selected
              </p>
            </div>
            <button
              onClick={clearCart}
              className="text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1.5 p-2 rounded-xl hover:bg-rose-500/10 active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear tray
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex gap-4 p-4 rounded-3xl glass-card hover:border-primary/30 transition-all duration-300 animate-fade-in-up stagger-${Math.min(
                  idx + 1,
                  5
                )}`}
              >
                {/* Thumbnail */}
                <div className="h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-white/10 relative">
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
                    <h4 className="font-extrabold text-base leading-tight truncate text-white font-heading">
                      {item.name}
                    </h4>
                    <span className="font-black text-lg text-white shrink-0 font-heading">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">₹{item.price.toFixed(0)} each</p>

                  {/* Quantity Stepper */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-2xl border border-white/10 bg-black/40 p-0.5 shadow-inner">
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        onClick={() => {
                          if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1)
                          else removeItem(item.id)
                        }}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3 stroke-[3]" />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-white font-mono">
                        {item.quantity}
                      </span>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3 stroke-[3]" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
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
          <div className="flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-primary/15 via-orange-500/10 to-rose-500/15 border border-primary/30 shadow-lg">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Total Bill</span>
              <p className="text-xs text-slate-400">Inclusive of all taxes</p>
            </div>
            <span className="text-3xl font-black text-white font-heading tracking-tight">
              ₹{getCartTotal().toFixed(0)}
            </span>
          </div>
        </div>

        {/* ── Right: Delivery & Checkout Form ───────────────── */}
        <div className="w-full lg:w-[400px]">
          <div className="sticky top-28 rounded-3xl glass-card border border-white/[0.08] overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-white/[0.08] bg-white/[0.02]">
              <h2 className="text-lg font-black tracking-tight text-white font-heading">
                Customer &amp; Spot Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">We will notify you once food is ready</p>
            </div>

            <form id="checkout-form" onSubmit={handleCheckout} className="px-6 py-6 flex flex-col gap-4">
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
                  className="rounded-2xl bg-black/40 border-white/10 focus:border-primary/60 h-11 text-sm text-white font-medium"
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
                  className="rounded-2xl bg-black/40 border-white/10 focus:border-primary/60 h-11 text-sm text-white font-medium font-mono"
                />
              </div>

              {/* Delivery type toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Service Option</Label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/40 border border-white/10">
                  {[
                    { value: 'pickup', label: 'Canteen Pickup', icon: Package },
                    { value: 'delivery', label: 'Campus Spot', icon: MapPin },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryType: value })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition-all duration-200 ${
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
                    className="rounded-2xl bg-black/40 border-white/10 focus:border-primary/60 h-11 text-sm text-white font-medium"
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
                  className="rounded-2xl bg-black/40 border-white/10 focus:border-primary/60 h-11 text-sm text-white font-medium"
                />
              </div>
            </form>

            <div className="px-6 pb-6 pt-2">
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl h-14 bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white font-black text-base hover:scale-[1.02] transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,94,14,0.4)] disabled:opacity-60 border border-white/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Preparing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay ₹{getCartTotal().toFixed(0)}</span>
                    <ArrowRight className="h-5 w-5" />
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
