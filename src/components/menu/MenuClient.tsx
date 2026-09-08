'use client'

import { useState, useMemo } from 'react'
import { MenuCard } from '@/components/menu/MenuCard'
import { Search, X, UtensilsCrossed, Sparkles, Flame, Check } from 'lucide-react'
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
  const [vegOnly, setVegOnly] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)

  const filtered = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = activeCategory === 'All' || item.category === activeCategory
      const matchVeg = !vegOnly || item.isVeg
      const matchSearch =
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
      return matchCat && matchVeg && matchSearch
    })
  }, [menuItems, activeCategory, vegOnly, debouncedSearch])

  const groupedFiltered = useMemo(() => {
    return filtered.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, typeof filtered>)
  }, [filtered])

  return (
    <div id="menu" className="relative flex-1 w-full flex flex-col items-center">
      {/* Ambient background light meshes continuing the Hero atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-2/3 right-0 w-[500px] h-[500px] bg-rose-500/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-[450px] h-[450px] bg-orange-500/10 blur-[130px] rounded-full pointer-events-none" />
      </div>

      <main className="relative z-10 w-full max-w-6xl px-4 sm:px-6 pb-28 flex flex-col gap-10">
        {/* ── Search & Filter Navigation Toolbar ─────────────── */}
        <div className="flex flex-col gap-3.5 bg-slate-950/75 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/[0.08] shadow-[0_16px_40px_-15px_rgba(0,0,0,0.8)]">
          {/* Top Row: Search Input + Veg-Only Quick Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search cravings (e.g. burger, cold coffee, fries)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/[0.08] bg-black/50 pl-11 pr-10 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all font-medium font-sans shadow-inner"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Veg Only Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 border ${
                vegOnly
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.3)]'
                  : 'bg-black/40 border-white/[0.08] text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-md border-1.5 flex items-center justify-center ${
                  vegOnly ? 'border-emerald-400 bg-emerald-500/20' : 'border-slate-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${vegOnly ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              </div>
              <span className="font-sans">Veg Only</span>
              {vegOnly && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>

          {/* Bottom Row: Category Horizontal Scroll Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none font-sans">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? menuItems.filter((i) => !vegOnly || i.isVeg).length
                  : menuItems.filter((i) => i.category === cat && (!vegOnly || i.isVeg)).length

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                >
                  <span>{CATEGORY_EMOJIS[cat] ?? '🍽️'}</span>
                  <span className="font-bold">{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                      activeCategory === cat
                        ? 'bg-white/25 text-white'
                        : 'bg-white/[0.08] text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Menu Items Grid ───────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in bg-slate-950/70 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-8 text-center my-4">
            <div className="relative w-28 h-28 mb-5 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full animate-pulse" />
              <UtensilsCrossed
                className="relative h-14 w-14 text-primary drop-shadow-[0_0_20px_rgba(255,94,14,0.5)] animate-bounce"
                style={{ animationDuration: '3s' }}
              />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-white font-display">
              No Bites Found
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed font-sans">
              {vegOnly
                ? 'No vegetarian items matched your search. Try unchecking the "Veg Only" filter.'
                : `We couldn't find anything matching "${search}". Try checking other categories or keywords.`}
            </p>
            <button
              onClick={() => {
                setSearch('')
                setActiveCategory('All')
                setVegOnly(false)
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-rose-500 text-white font-bold text-xs hover:opacity-90 transition shadow-lg active:scale-95 font-sans"
            >
              Reset Filters & Show All
            </button>
          </div>
        ) : (
          Object.entries(groupedFiltered).map(([category, items], groupIdx) => (
            <section
              key={category}
              className={`flex flex-col gap-5 animate-fade-in-up stagger-${Math.min(
                groupIdx + 1,
                5
              )}`}
            >
              {/* Category Header with Glow Line */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xl shadow-inner">
                    {CATEGORY_EMOJIS[category] ?? '🍽️'}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
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

              {/* Grid with 4-Column Layout and Precise Proportions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
