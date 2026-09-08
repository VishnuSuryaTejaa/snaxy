'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

import { Order, Stats } from '@/types'
import { AdminStatsBar } from '@/components/admin/AdminStatsBar'
import { AdminOrderFilter } from '@/components/admin/AdminOrderFilter'
import { AdminOrderCard } from '@/components/admin/AdminOrderCard'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchAll = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/stats'),
      ])
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(data.orders)
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        )
        // Also refresh stats
        fetch('/api/admin/stats').then(r => r.json()).then(d => setStats(d.stats))
      }
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const filteredOrders = activeFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === activeFilter)

  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(interval)
  }, [])

  const relativeTime = () => {
    const diff = Math.floor((now - lastUpdated.getTime()) / 1000)
    if (diff < 5) return 'just now'
    if (diff < 60) return `${diff}s ago`
    return `${Math.floor(diff / 60)}m ago`
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading live orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full p-4 lg:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* ── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Live Orders</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Auto-refreshes every 15s &bull; Updated {relativeTime()}
            </p>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-white/20 hover:bg-white/5 transition-all active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* ── Stats Bar ───────────────────────────── */}
        {stats && <AdminStatsBar stats={stats} />}

        {/* ── Filter Tabs ─────────────────────────── */}
        <AdminOrderFilter
          orders={orders}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        {/* ── Order Cards ─────────────────────────── */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 blur-[30px] rounded-full animate-pulse" />
              <div className="text-6xl relative z-10 drop-shadow-2xl">🎉</div>
              <div className="absolute top-0 right-0 text-2xl animate-bounce" style={{ animationDuration: '2s' }}>✨</div>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-2">No orders here</h3>
            <p className="text-muted-foreground max-w-[250px] mx-auto text-sm">
              {activeFilter === 'all' ? 'Waiting for the first order to arrive...' : 'No orders with this current status.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order, idx) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                idx={idx}
                updateOrderStatus={updateOrderStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
