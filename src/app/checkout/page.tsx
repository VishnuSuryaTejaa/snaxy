'use client'

import { useState, useEffect, Suspense, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeSVG } from 'qrcode.react'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { Copy, Check, ArrowLeft, Loader2, UploadCloud, Smartphone, ShieldCheck, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

const STEPS = [
  { label: 'Scan & Pay', emoji: '📱' },
  { label: 'Enter UTR', emoji: '🔢' },
  { label: 'Verified', emoji: '✅' },
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

  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'snaxy@upi'
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
      <div className="flex-1 w-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Preparing payment...</p>
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
   * Resizes large camera photos to ≤800px JPEG to keep upload instantaneous (<150KB).
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
          toast.success('Screenshot attached!')
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
        sessionStorage.removeItem('snaxy_active_order')
        toast.success('Payment submitted! Awaiting kitchen verification.')
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

  const activeStep = utr.length === 12 ? 2 : 1

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md flex flex-col gap-5">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-2">
            Order Ref: <span className="font-mono">{shortCode}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Complete Payment</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pay <span className="font-extrabold text-primary text-xl">₹{totalAmount.toFixed(0)}</span> via any UPI App
          </p>
        </div>

        {/* Step indicator */}
        <div className="relative w-full flex items-start justify-between px-6 mb-1">
          <div className="absolute top-[14px] left-[20%] right-[20%] h-0.5 bg-muted/50" />
          <div
            className="absolute top-[14px] left-[20%] h-0.5 bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((activeStep - 1) / (STEPS.length - 1)) * 60}%` }}
          />

          {STEPS.map((step, i) => {
            const done = i < activeStep - 1
            const active = i === activeStep - 1
            return (
              <div key={i} className="flex flex-col items-center flex-1 relative gap-1.5 z-10">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                    done
                      ? 'bg-primary border-primary text-primary-foreground'
                      : active
                      ? 'bg-background border-primary text-primary scale-110 shadow-sm'
                      : 'bg-background border-muted/50 text-muted-foreground opacity-40'
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : step.emoji}
                </div>
                <span
                  className={`text-[10px] font-semibold transition-all duration-300 ${
                    active || done ? 'text-foreground' : 'text-muted-foreground opacity-40'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-white/[0.07] bg-card overflow-hidden shadow-xl">
          {/* Dynamic QR Section */}
          <div className="flex flex-col items-center gap-4 p-6 border-b border-white/[0.07] bg-gradient-to-b from-primary/5 to-transparent">
            {/* Dynamic QR */}
            <div className="relative p-3.5 rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
              <QRCodeSVG
                value={upiUri}
                size={190}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                includeMargin={false}
              />
              {/* Center Logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center text-lg font-bold border border-neutral-200">
                  ⚡
                </div>
              </div>
            </div>

            {/* Note alert */}
            <p className="text-[11px] text-muted-foreground text-center bg-muted/40 px-3 py-1.5 rounded-xl border border-white/[0.07]">
              Remark / Note in UPI app will be set to: <strong className="text-primary font-mono">{shortCode}</strong>
            </p>

            {/* Pay via UPI App button (for mobile browsers) */}
            <a
              href={upiUri}
              className="w-full sm:hidden flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition active:scale-95"
            >
              <Smartphone className="h-4 w-4" />
              Pay via UPI App (GPay / PhonePe / Paytm)
            </a>

            {/* UPI ID copy */}
            <div className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-white/[0.07]">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">UPI ID</p>
                <p className="font-mono font-bold text-xs text-foreground truncate">{upiId}</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-primary/15 text-primary border border-primary/25 hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {/* UTR Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="utr" className="text-xs font-bold flex items-center gap-1.5">
                  12-Digit UPI Reference (UTR) <span className="text-primary">*</span>
                </Label>
                <span className="text-[10px] font-mono text-muted-foreground">{utr.length}/12</span>
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
                className="font-mono text-center text-base tracking-widest rounded-xl bg-muted/30 border-white/10 focus:border-primary/50 h-11"
              />
              {/* Animated Progress Bar */}
              <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    utr.length === 12 ? 'bg-emerald-500' : 'bg-primary'
                  }`}
                  style={{ width: `${(utr.length / 12) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Found in your payment app under &quot;UPI Ref No.&quot; or &quot;UTR&quot;
              </p>
            </div>

            {/* Payer Name (Optional) */}
            <div className="space-y-1">
              <Label htmlFor="payerName" className="text-xs font-semibold text-muted-foreground">
                Payer Name on UPI App (Optional)
              </Label>
              <Input
                id="payerName"
                placeholder={customerName || 'Name shown on your Google Pay / PhonePe'}
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="rounded-xl bg-muted/30 border-white/10 text-xs h-9"
              />
            </div>

            {/* Screenshot Upload (Optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Payment Screenshot (Optional)</span>
                <span className="text-[10px] text-muted-foreground">Fast Auto-Compress</span>
              </Label>

              {screenshotBase64 ? (
                <div className="relative rounded-xl border border-white/10 overflow-hidden bg-muted/20 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-white/10">
                      <Image
                        src={screenshotBase64}
                        alt="Screenshot Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Screenshot Attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreenshotBase64(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-destructive transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-white/15 hover:border-primary/40 rounded-xl p-3 cursor-pointer bg-muted/20 hover:bg-muted/30 transition text-xs text-muted-foreground">
                  {isCompressingImg ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <UploadCloud className="h-4 w-4 text-primary" />
                  )}
                  <span>{isCompressingImg ? 'Compressing...' : 'Upload payment confirmation screenshot'}</span>
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
              className="w-full h-12 rounded-xl font-bold text-sm gap-2 shadow-[0_4px_24px_oklch(0.72_0.18_50/25%)] mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Submission...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Submit Payment Details
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Back Link */}
        <button
          type="button"
          onClick={() => router.push('/cart')}
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancel &amp; Back to Cart
        </button>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
