'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, ArrowRight, User, LogOut } from 'lucide-react'
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
      const t = setTimeout(() => setAnimateBadge(false), 300)
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
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? 'glass border-b border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="container flex h-16 items-center justify-between px-4 max-w-6xl mx-auto">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-base leading-none">🔥</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight gradient-text">Snaxy</span>
          </Link>

          {/* Cart and Login */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground/70 hover:text-muted-foreground hover:bg-white/5 transition-all"
            >
              Staff Portal
            </Link>

            <div className="h-6 w-px bg-white/10 hidden sm:block mx-1"></div>

            {isLoggedIn ? (
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  window.location.reload()
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            <Link
              href="/cart"
              className={`relative p-2.5 rounded-xl transition-all border ${
                isActive('/cart')
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'border-transparent hover:border-white/10 hover:bg-white/5 text-foreground'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {mounted && cartItemCount > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold leading-none text-primary-foreground bg-primary rounded-full shadow-[0_0_8px_oklch(0.72_0.18_50/50%)] ${
                    animateBadge ? 'animate-badge-bounce' : ''
                  }`}
                >
                  {cartItemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* Sticky Bottom Cart Bar for Mobile Devices */}
      {showMobileBottomBar && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden animate-fade-in-up">
          <Link
            href="/cart"
            className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-primary/30 font-bold active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-black/20 flex items-center justify-center font-extrabold text-sm">
                {cartItemCount}
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs opacity-90">View Cart</p>
                <p className="text-base font-extrabold">₹{getCartTotal().toFixed(0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <span>Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      )}
    </>
  )
}
