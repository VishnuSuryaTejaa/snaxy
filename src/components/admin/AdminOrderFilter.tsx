import { Order } from '@/types'
import { ORDER_STATUS } from '@/lib/constants'

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: ORDER_STATUS.PAYMENT_SUBMITTED, label: 'Pending Verify' },
  { key: ORDER_STATUS.VERIFIED, label: 'Verified' },
  { key: ORDER_STATUS.PREPARING, label: 'Preparing' },
  { key: ORDER_STATUS.READY, label: 'Ready' },
  { key: ORDER_STATUS.COMPLETED, label: 'Completed' },
  { key: ORDER_STATUS.CANCELLED, label: 'Cancelled' },
  { key: ORDER_STATUS.REJECTED, label: 'Rejected' },
]

export function AdminOrderFilter({
  orders,
  activeFilter,
  setActiveFilter,
}: {
  orders: Order[]
  activeFilter: string
  setActiveFilter: (filter: string) => void
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {FILTER_TABS.map((tab) => {
        const count =
          tab.key === 'all'
            ? orders.length
            : orders.filter((o) => o.status === tab.key).length
        return (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap border transition-all ${
              activeFilter === tab.key
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'border-white/[0.07] text-muted-foreground hover:border-white/15 hover:text-foreground hover:bg-white/5'
            }`}
          >
            {tab.label}
            <span
              className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                activeFilter === tab.key
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
