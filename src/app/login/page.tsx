'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, KeyRound, Phone, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const phone = formData.get('phone')
    const password = formData.get('password')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      const data = await res.json()

      if (data.success) {
        window.location.href = from
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Aurora mesh */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl glass-card p-8 sm:p-10 shadow-2xl border border-white/[0.08] animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(255,94,14,0.6)] border border-white/20">
              <span className="text-2xl leading-none">🔥</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white font-heading">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-semibold">
              Sign in to order your favourite bites in seconds
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-center font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 pl-1">Phone Number</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="10-digit mobile number"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 pl-1">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Enter your password"
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white rounded-2xl font-black text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_25px_rgba(255,94,14,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 mt-6 border border-white/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-orange-400 font-bold hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
