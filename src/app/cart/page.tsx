'use client'

import { useCartStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, MapPin, Package, Loader2 } from 'lucide-react'
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
      <div className="flex-1 w-full flex flex-col items-center justify-center p-8 animate-fade-in min-h-[60vh]">
        <div className="text-center max-w-sm flex flex-col items-center">
          <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
            {/* Glowing background */}
            <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full animate-pulse" />
            {/* Main icon */}
            <ShoppingBag
              className="relative h-20 w-20 text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-bounce"
              style={{ animationDuration: '3s' }}
            />
            {/* Floating emojis */}
            <div
              className="absolute -top-2 -right-2 text-3xl animate-bounce"
              style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
            >
              🍕
            </div>
            <div
              className="absolute bottom-2 -left-2 text-3xl animate-bounce"
              style={{ animationDuration: '2.2s', animationDelay: '0.2s' }}
            >
              🥤
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Looks like you haven&apos;t added any snacks yet. Let&apos;s fix that before you get hungry!
          </p>
          <Link href="/">
            <Button className="gap-2 rounded-xl h-12 px-8 font-bold text-base shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] active:scale-95">
              Browse Menu <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) return
    if (formData.deliveryType === 'delivery' && !formData.address) return

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
    <div className="flex-1 w-full flex flex-col items-center animate-fade-in">
      <main className="w-full max-w-6xl px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* ── Left: Cart Items ──────────────────── */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight">Your Order</h1>
            <button
              onClick={clearCart}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex gap-4 p-4 rounded-2xl border border-white/[0.07] bg-card hover:border-white/[0.12] transition-all animate-fade-in-up stagger-${Math.min(
                  idx + 1,
                  5
                )}`}
              >
                {/* Thumbnail */}
                <div className="h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-muted/40 flex items-center justify-center">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl opacity-40">🍽️</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold leading-tight truncate">{item.name}</h4>
                    <span className="font-bold text-primary shrink-0">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">₹{item.price} each</p>

                  {/* Quantity controls */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-xl border border-white/10 bg-muted/30">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-l-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all active:scale-95"
                        onClick={() => {
                          if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1)
                          else removeItem(item.id)
                        }}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-bold text-primary">
                        {item.quantity}
                      </span>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all active:scale-95"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <span className="font-semibold text-primary">Order Total</span>
            <span className="text-2xl font-extrabold text-primary">₹{getCartTotal().toFixed(0)}</span>
          </div>
        </div>

        {/* ── Right: Details form ───────────────── */}
        <div className="w-full lg:w-[380px]">
          <div className="sticky top-24 rounded-2xl border border-white/[0.07] bg-card overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.07]">
              <h2 className="text-lg font-bold tracking-tight">Delivery Details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">We&apos;ll contact you on this number</p>
            </div>

            <form id="checkout-form" onSubmit={handleCheckout} className="px-6 py-5 flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl bg-muted/30 border-white/10 focus:border-primary/50 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold">
                  Phone <span className="text-primary">*</span>
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
                  className="rounded-xl bg-muted/30 border-white/10 focus:border-primary/50 h-10"
                />
              </div>

              {/* Delivery type toggle */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Order Type</Label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/30 border border-white/10">
                  {[
                    { value: 'pickup', label: 'Pick Up', icon: Package },
                    { value: 'delivery', label: 'Delivery', icon: MapPin },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryType: value })}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all ${
                        formData.deliveryType === value
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
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
                  <Label htmlFor="address" className="text-sm font-semibold">
                    Delivery Address <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Room / Desk / Location details"
                    required={formData.deliveryType === 'delivery'}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="rounded-xl bg-muted/30 border-white/10 focus:border-primary/50 h-10"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-semibold text-muted-foreground">
                  Special Instructions
                </Label>
                <Input
                  id="notes"
                  placeholder="Extra spicy, no onions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="rounded-xl bg-muted/30 border-white/10 focus:border-primary/50 h-10"
                />
              </div>
            </form>

            <div className="px-6 pb-6">
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl h-12 bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all active:scale-[0.98] shadow-[0_4px_24px_oklch(0.72_0.18_50/25%)] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    Proceed to Pay ₹{getCartTotal().toFixed(0)}
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
