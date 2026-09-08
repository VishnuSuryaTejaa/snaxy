'use client'

import { useState, useMemo } from 'react'
import { MenuCard } from '@/components/menu/MenuCard'
import { Search, X, Sparkles, UtensilsCrossed } from 'lucide-react'
import type { MenuItem } from '@prisma/client'
import { useDebounce } from '@/hooks/use-debounce'

interface MenuClientProps {
  menuItems: MenuItem[]
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Snacks: '🥟',
  Meals: '🍛',
  Beverages: '☕',
  Desserts: '🍮',
  All: '🔥',
}

export function MenuClient({ menuItems }: MenuClientProps) {
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map((i) => i.category)))
    return ['All', ...cats]
  }, [menuItems])

  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  const filtered = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = activeCategory === 'All' || item.category === activeCategory
      const matchSearch =
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
      return matchCat && matchSearch
    })
  }, [menuItems, activeCategory, debouncedSearch])

  const groupedFiltered = useMemo(() => {
    return filtered.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, typeof filtered>)
  }, [filtered])

  return (
    <div id="menu" className="flex-1 w-full flex flex-col items-center">
      <main className="w-full max-w-6xl px-4 sm:px-6 pb-24 flex flex-col gap-10">
        {/* ── Search + Filter Toolbar ─────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass p-4 sm:p-5 rounded-3xl border border-white/[0.08] shadow-xl">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search cravings (e.g. burger, cold coffee)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/[0.08] bg-black/40 pl-11 pr-10 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all font-medium font-sans"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none font-sans">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? menuItems.length
                  : menuItems.filter((i) => i.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                >
                  <span>{CATEGORY_EMOJIS[cat] ?? '🍽️'}</span>
                  <span className="font-bold">{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                    activeCategory === cat ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Menu Items Grid ───────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in glass rounded-3xl border border-white/[0.08] p-8 text-center my-6">
            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full animate-pulse" />
              <UtensilsCrossed className="relative h-16 w-16 text-primary drop-shadow-[0_0_20px_rgba(255,94,14,0.5)] animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-white font-display">
              No Delicious Bites Found
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed font-sans">
              We couldn&apos;t find anything matching &quot;{search}&quot;. Try exploring other categories or clearing your search.
            </p>
            <button
              onClick={() => {
                setSearch('')
                setActiveCategory('All')
              }}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition shadow-lg active:scale-95 font-sans"
            >
              Show Full Menu
            </button>
          </div>
        ) : (
          Object.entries(groupedFiltered).map(([category, items], groupIdx) => (
            <section
              key={category}
              className={`flex flex-col gap-6 animate-fade-in-up stagger-${Math.min(
                groupIdx + 1,
                5
              )}`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xl shadow-inner">
                    {CATEGORY_EMOJIS[category] ?? '🍽️'}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-display">
                      {category}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium font-sans">
                      Freshly prepared on order
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-sans">
                  <span className="text-xs font-bold text-slate-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {items.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    className={`animate-fade-in-up stagger-${Math.min(itemIdx + 1, 6)}`}
                  >
                    <MenuCard item={item} />
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  )
}
