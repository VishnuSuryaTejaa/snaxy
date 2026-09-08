'use client'

import { useState, useMemo } from 'react'
import { MenuCard } from '@/components/menu/MenuCard'
import { Search } from 'lucide-react'
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
  All: '✨',
}

export function MenuClient({ menuItems }: MenuClientProps) {
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map((i) => i.category)))
    return ['All', ...cats]
  }, [menuItems])

  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const filtered = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = activeCategory === 'All' || item.category === activeCategory
      const matchSearch = item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
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
    <div className="flex-1 w-full flex flex-col items-center">
      <main className="w-full max-w-6xl px-4 pb-16 flex flex-col gap-10">



        {/* ── Search + Category filter ─────────────── */}
        <div className="flex flex-col gap-4 animate-fade-in-up stagger-2">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              >
                {CATEGORY_EMOJIS[cat] ?? '🍽️'} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Menu grid ───────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="text-center max-w-sm flex flex-col items-center">
              <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                {/* Glowing background */}
                <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full animate-pulse" />
                {/* Main icon */}
                <Search className="relative h-16 w-16 text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-bounce" style={{ animationDuration: '3s' }} />
                {/* Floating emojis */}
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>🧐</div>
                <div className="absolute bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '0.2s' }}>🤔</div>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight mb-2">No items found</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We couldn&apos;t find anything matching your search. Try a different category or term!
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedFiltered).map(([category, items], groupIdx) => (
            <section key={category} className={`flex flex-col gap-5 animate-fade-in-up stagger-${Math.min(groupIdx + 1, 5)}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CATEGORY_EMOJIS[category] ?? '🍽️'}</span>
                <h2 className="text-xl font-bold tracking-tight">{category}</h2>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">{items.length} items</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, itemIdx) => (
                  <div key={item.id} className={`animate-fade-in-up stagger-${Math.min(itemIdx + 1, 5)}`}>
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
