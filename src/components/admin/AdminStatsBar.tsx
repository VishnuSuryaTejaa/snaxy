import { TrendingUp, Clock, ChefHat, IndianRupee } from 'lucide-react'
import { Stats } from '@/types'

export function AdminStatsBar({ stats }: { stats: Stats }) {
  if (!stats) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { icon: TrendingUp,   label: "Today's Orders",  value: stats.totalToday,                    color: 'text-status-placed-fg',   bg: 'bg-status-placed/10',   border: 'border-status-placed/20' },
        { icon: IndianRupee, label: 'Revenue Today',   value: `₹${stats.revenueToday.toFixed(0)}`, color: 'text-primary',    bg: 'bg-primary/10',    border: 'border-primary/20' },
        { icon: Clock,       label: 'Pending Verify',  value: stats.pending,                       color: 'text-status-pending-fg', bg: 'bg-status-pending/10', border: 'border-status-pending/20' },
        { icon: ChefHat,     label: 'In Kitchen',      value: stats.preparing,                     color: 'text-status-preparing-fg', bg: 'bg-status-preparing/10', border: 'border-status-preparing/20' },
      ].map(({ icon: Icon, label, value, color, bg, border }) => (
        <div key={label} className={`flex items-center gap-3 rounded-2xl border p-4 ${border} ${bg} transition-all`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg} border ${border}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-xl font-extrabold ${color}`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
