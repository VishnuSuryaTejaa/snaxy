'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, ArrowRight, User, LogOut, Sparkles, Shield } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { useState, useEffect, useRef } from 'react'

export function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const items = useCartStore((state) => state.items)
  const getCartTotal = useCartStore((state) => state.getCartTotal)
  const mounted = useIsMounted()
  const pathname = usePathname()

  const [scrolled, setScrolled] = useState(false)
  const [animateBadge, setAnimateBadge] = useState(false)
  const prevCountRef = useRef(0)

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const isActive = (href: string) => pathname === href

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (cartItemCount > prevCountRef.current) {
      setAnimateBadge(true)
      const t = setTimeout(() => setAnimateBadge(false), 400)
      prevCountRef.current = cartItemCount
      return () => clearTimeout(t)
    }
    prevCountRef.current = cartItemCount
  }, [cartItemCount])

  // Hide on all admin pages — admin has its own AdminNav
  if (pathname.startsWith('/admin')) return null

  const showMobileBottomBar =
    mounted &&
    cartItemCount > 0 &&
    !pathname.startsWith('/cart') &&
    !pathname.startsWith('/checkout') &&
    !pathname.startsWith('/order/')

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'glass border-b border-white/[0.08] shadow-[0_10px_35px_-10px_rgba(0,0,0,0.8)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-rose-500 shadow-[0_0_20px_-3px_rgba(255,94,14,0.6)] group-hover:scale-105 transition-transform duration-300">
              <span className="text-lg leading-none">🔥</span>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-primary to-rose-500 opacity-30 blur-sm group-hover:opacity-60 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tighter gradient-text leading-none font-heading">
                SNAXY
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Bites
              </span>
            </div>
          </Link>

          {/* Center Campus Live Status (Desktop) */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-semibold text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Serving Hot &amp; Fresh</span>
            <span className="text-white/20">|</span>
            <span className="text-primary font-bold">⚡ 5-Min Canteen Prep</span>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-primary" />
              Staff
            </Link>

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            {isLoggedIn ? (
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  window.location.reload()
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 transition-all hover:border-white/20 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-slate-200 hover:text-white transition-all hover:border-primary/40 active:scale-95 shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Cart Button */}
            <Link
              href="/cart"
              className={`relative flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl transition-all duration-300 font-bold text-xs gap-2 ${
                isActive('/cart')
                  ? 'bg-gradient-to-r from-primary to-rose-500 text-white shadow-[0_0_20px_rgba(255,94,14,0.5)]'
                  : 'bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary hover:text-orange-400'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {mounted && cartItemCount > 0 && (
                <span
                  className={`min-w-[20px] h-[20px] flex items-center justify-center px-1.5 text-[11px] font-extrabold leading-none text-white bg-gradient-to-r from-orange-500 to-rose-600 rounded-full shadow-[0_0_12px_rgba(255,94,14,0.8)] border border-white/20 ${
                    animateBadge ? 'animate-scale-pop' : ''
                  }`}
                >
                  {cartItemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* Sticky Bottom Quick Cart Bar for Mobile */}
      {showMobileBottomBar && (
        <div className="fixed bottom-5 left-4 right-4 z-40 sm:hidden animate-fade-in-up">
          <Link
            href="/cart"
            className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-primary via-orange-600 to-rose-600 text-white shadow-[0_12px_35px_-5px_rgba(255,94,14,0.5)] border border-white/20 font-bold active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-black/25 backdrop-blur-md flex items-center justify-center font-extrabold text-sm border border-white/10">
                {cartItemCount}
              </div>
              <div className="text-left leading-tight">
                <p className="text-[11px] text-white/80 uppercase tracking-wider font-semibold">Ready to Munch?</p>
                <p className="text-lg font-black tracking-tight font-heading">₹{getCartTotal().toFixed(0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-extrabold bg-white/15 px-3.5 py-1.5 rounded-xl border border-white/20 backdrop-blur-md">
              <span>Checkout</span>
              <ArrowRight className="h-4 w-4 animate-pulse" />
            </div>
          </Link>
        </div>
      )}
    </>
  )
}
