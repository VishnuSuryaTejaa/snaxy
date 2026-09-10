'use client'

import { useState, useEffect, Suspense, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeSVG } from 'qrcode.react'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { Copy, Check, ArrowLeft, Loader2, UploadCloud, Smartphone, ShieldCheck, X, Sparkles, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

const STEPS = [
  { label: 'Scan & Pay', emoji: '📱' },
  { label: 'Enter UTR', emoji: '🔢' },
  { label: 'Kitchen Alert', emoji: '🔔' },
]

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderIdParam = searchParams.get('order')
  const mounted = useIsMounted()
  const [, startTransition] = useTransition()

  const [orderId, setOrderId] = useState<string | null>(orderIdParam)
  const [shortCode, setShortCode] = useState<string>('SNX-PAY')
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [customerName, setCustomerName] = useState<string>('')
  const [isLoadingOrder, setIsLoadingOrder] = useState<boolean>(true)

  const [utr, setUtr] = useState('')
  const [payerName, setPayerName] = useState('')
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null)
  const [isCompressingImg, setIsCompressingImg] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const upiId = process.env.NEXT_PUBLIC_UPI_ID || '9676842461@sbi'
  const merchantName = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Snaxy Store'

  useEffect(() => {
    if (!mounted) return

    // 1. Try to load from session storage first
    let found = false
    try {
      const stored = sessionStorage.getItem('snaxy_active_order')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (!orderIdParam || parsed.orderId === orderIdParam) {
          setOrderId(parsed.orderId)
          setShortCode(parsed.shortCode || 'SNX-PAY')
          setTotalAmount(parsed.totalAmount || 0)
          setCustomerName(parsed.customerName || '')
          setPayerName((prev) => prev || parsed.customerName || '')
          setIsLoadingOrder(false)
          found = true
        }
      }
    } catch {
      // Ignore
    }

    // 2. Fetch order from server if not found in session
    if (!found && orderIdParam) {
      fetch(`/api/orders/${orderIdParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order) {
            setOrderId(data.order.id)
            setShortCode(data.order.shortCode || 'SNX-PAY')
            setTotalAmount(data.order.totalAmount || 0)
            setCustomerName(data.order.customerName || '')
            setPayerName((prev) => prev || data.order.customerName || '')
          } else {
            toast.error('Order not found')
            router.push('/cart')
          }
        })
        .catch(() => {
          toast.error('Failed to load order')
          router.push('/cart')
        })
        .finally(() => setIsLoadingOrder(false))
    } else if (!found && !orderIdParam) {
      router.push('/cart')
    }
  }, [mounted, orderIdParam, router])

  if (!mounted || isLoadingOrder || !orderId) {
    return (
      <div className="relative flex-1 w-full flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4 bg-slate-950/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-xs text-slate-300 font-bold font-sans">Generating dynamic UPI gateway...</p>
        </div>
      </div>
    )
  }

  // UPI deep link with exact transaction note containing order shortCode
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    merchantName
  )}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(shortCode)}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(upiId)
    setCopied(true)
    toast.success('UPI ID copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  /**
   * Client-side Canvas Image Compression
   */
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, etc.)')
      return
    }

    setIsCompressingImg(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
          setScreenshotBase64(compressedDataUrl)
          toast.success('Receipt screenshot attached!')
        }
        setIsCompressingImg(false)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!utr || utr.length !== 12) {
      toast.error('Please enter a valid 12-digit UPI UTR / Reference number')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr,
          payerName: payerName.trim() || undefined,
          screenshot: screenshotBase64 || undefined,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        try {
          const existing = JSON.parse(localStorage.getItem('snaxy_recent_orders') || '[]')
          const updated = [orderId, ...existing.filter((id: string) => id !== orderId)].slice(0, 30)
          localStorage.setItem('snaxy_recent_orders', JSON.stringify(updated))
        } catch {
          // Ignore
        }
        sessionStorage.removeItem('snaxy_active_order')
        toast.success('Payment submitted! Alerting kitchen right now.')
        startTransition(() => {
          router.push(`/order/${orderId}`)
        })
      } else {
        toast.error(data.error || 'Failed to submit payment details.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Payment submission error:', error)
      toast.error('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSwitchToCod = async () => {
    if (!orderId) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ switchToCod: true }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Switched to Cash on Delivery! Kitchen is preparing your bites.')
        router.push(`/order/${orderId}`)
      } else {
        toast.error(data.error || 'Failed to switch payment method')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeStep = utr.length === 12 ? 2 : 1

  return (
    <div className="relative flex-1 w-full flex flex-col items-center justify-center px-4 sm:px-6 py-8 animate-fade-in pb-20">
      {/* Ambient Aurora Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/15 blur-[150px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-bold text-orange-300 mb-3 shadow-[0_0_15px_rgba(255,94,14,0.3)]">
            <span className="font-sans">Order Reference:</span>
            <span className="font-mono font-black text-white bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
              {shortCode}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display">
            Instant UPI Payment
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium font-sans">
            Amount Due:{' '}
            <span className="font-black text-white text-2xl font-display text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">
              ₹{totalAmount.toFixed(0)}
            </span>
          </p>
        </div>

        {/* Multi-step progress indicator */}
        <div className="relative w-full flex items-start justify-between px-6 font-sans">
          <div className="absolute top-[14px] left-[20%] right-[20%] h-0.5 bg-white/10" />
          <div
            className="absolute top-[14px] left-[20%] h-0.5 bg-gradient-to-r from-primary to-rose-500 transition-all duration-500 ease-out"
            style={{ width: `${((activeStep - 1) / (STEPS.length - 1)) * 60}%` }}
          />

          {STEPS.map((step, i) => {
            const done = i < activeStep - 1
            const active = i === activeStep - 1
            return (
              <div key={i} className="flex flex-col items-center flex-1 relative gap-1.5 z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
                    done
                      ? 'bg-gradient-to-r from-primary to-rose-500 border-transparent text-white shadow-md'
                      : active
                      ? 'bg-slate-900 border-primary text-primary scale-110 shadow-[0_0_15px_rgba(255,94,14,0.5)]'
                      : 'bg-slate-900 border-white/10 text-slate-500 opacity-50'
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : step.emoji}
                </div>
                <span
                  className={`text-[11px] font-bold transition-all duration-300 ${
                    active || done ? 'text-white' : 'text-slate-500 opacity-50'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
          {/* Dynamic QR Section */}
          <div className="flex flex-col items-center gap-4 p-6 sm:p-7 border-b border-white/[0.08] bg-gradient-to-b from-primary/10 to-transparent">
            {/* Dynamic QR Container */}
            <div className="relative p-3.5 rounded-3xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.6)] ring-4 ring-primary/20">
              <QRCodeSVG
                value={upiUri}
                size={185}
                bgColor="#ffffff"
                fgColor="#08090d"
                level="M"
                includeMargin={false}
              />
              {/* Center Snaxy Logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-rose-500 shadow-xl flex items-center justify-center text-base font-bold border-2 border-white">
                  ⚡
                </div>
              </div>
            </div>

            {/* Note badge */}
            <p className="text-xs text-slate-300 text-center bg-black/50 px-3.5 py-1.5 rounded-2xl border border-white/10 font-sans">
              UPI Remark/Note will auto-fill to:{' '}
              <strong className="text-orange-400 font-mono font-black">{shortCode}</strong>
            </p>

            {/* Pay via UPI App button (Mobile 1-Tap) */}
            <a
              href={upiUri}
              className="w-full sm:hidden flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white font-black text-xs shadow-[0_0_20px_rgba(255,94,14,0.4)] transition active:scale-95 border border-white/20 font-sans"
            >
              <Smartphone className="h-4 w-4" />
              Pay via UPI App (GPay / PhonePe / Paytm)
            </a>

            {/* UPI ID copy box */}
            <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 font-sans">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Merchant UPI ID</p>
                <p className="font-mono font-bold text-xs text-white truncate">{upiId}</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all duration-200 ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'bg-primary/20 text-orange-300 border border-primary/30 hover:bg-primary hover:text-white'
                }`}
              >
                {copied ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 flex flex-col gap-4 font-sans">
            {/* UTR Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="utr" className="text-xs font-black text-white flex items-center gap-1.5">
                  12-Digit UPI Ref / UTR <span className="text-primary">*</span>
                </Label>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {utr.length}/12
                </span>
              </div>
              <Input
                id="utr"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{12}"
                placeholder="e.g. 423982910293"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                required
                className="font-mono text-center text-lg font-black tracking-widest rounded-2xl bg-black/50 border-white/10 focus:border-primary/60 h-12 text-white shadow-inner"
              />
              {/* Animated Progress Bar */}
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    utr.length === 12
                      ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${(utr.length / 12) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Found in your banking app receipt under &quot;UPI Ref No&quot; or &quot;UTR&quot;
              </p>
            </div>

            {/* Payer Name (Optional) */}
            <div className="space-y-1">
              <Label htmlFor="payerName" className="text-xs font-bold text-slate-400">
                Payer Name on UPI App (Optional)
              </Label>
              <Input
                id="payerName"
                placeholder={customerName || 'Name on GPay / PhonePe'}
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="rounded-2xl bg-black/50 border-white/10 text-xs h-10 text-white font-medium shadow-inner"
              />
            </div>

            {/* Screenshot Upload (Optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>Payment Screenshot (Optional)</span>
                <span className="text-[10px] text-emerald-400 font-semibold">⚡ Instant Compress</span>
              </Label>

              {screenshotBase64 ? (
                <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-black/50 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-white/10">
                      <Image
                        src={screenshotBase64}
                        alt="Screenshot Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Screenshot Attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreenshotBase64(null)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-primary/50 rounded-2xl p-3 cursor-pointer bg-black/30 hover:bg-black/50 transition text-xs text-slate-300">
                  {isCompressingImg ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <UploadCloud className="h-4 w-4 text-primary" />
                  )}
                  <span className="font-semibold">
                    {isCompressingImg ? 'Compressing receipt...' : 'Upload payment confirmation screenshot'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                    disabled={isCompressingImg}
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || utr.length !== 12 || isCompressingImg}
              className="w-full h-12 rounded-2xl font-black text-sm gap-2 bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white shadow-[0_0_25px_rgba(255,94,14,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/20 disabled:opacity-50 mt-1 font-display"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting to Kitchen...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Submit Payment Details</span>
                </>
              )}
            </Button>
          </form>

          {/* Switch to Cash on Delivery Option */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Banknote className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Prefer to pay cash?</p>
                <p className="text-[10px] text-slate-400">Pay runner upon food arrival</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSwitchToCod}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              Pay with COD
            </button>
          </div>
        </div>

        {/* Back Link */}
        <button
          type="button"
          onClick={() => router.push('/cart')}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors mx-auto p-2 font-sans"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancel &amp; Return to Tray
        </button>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
