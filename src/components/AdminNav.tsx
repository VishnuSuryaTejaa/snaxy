'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChefHat, LayoutDashboard, UtensilsCrossed, LogOut } from 'lucide-react'
import { useState } from 'react'
import NotificationBell from '@/components/admin/NotificationBell'

const NAV_LINKS = [
  { href: '/admin', label: 'Orders', icon: LayoutDashboard, exact: true },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 lg:px-8">
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-2 font-extrabold text-lg group">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
            <ChefHat className="h-4 w-4 text-primary" />
          </div>
          <span>
            Snaxy <span className="text-primary text-sm font-bold bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md ml-1">Admin</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-action-reject-fg hover:bg-action-reject/10 border border-transparent hover:border-action-reject/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  )
}
