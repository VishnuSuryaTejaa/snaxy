'use client'

import { useState, useEffect, useMemo } from 'react'
import { Switch } from '@/components/ui/switch'
import { Search, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, XCircle, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'

import type { MenuItem } from '@prisma/client'

const CATEGORY_EMOJIS: Record<string, string> = {
  Snacks: '🥟',
  Meals: '🍛',
  Beverages: '☕',
  Desserts: '🍮',
}

export default function AdminMenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // Add Item State
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Snacks',
    isVeg: true
  })

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const res = await fetch('/api/admin/menu')
        if (res.ok) {
          const data = await res.json()
          if (!ignore) setItems(data.items)
        }
      } catch (err) {
        console.error('Failed to fetch menu:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const toggleSoldOut = async (itemId: string, current: boolean) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isSoldOut: !current } : i))
    )

    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, isSoldOut: !current }),
      })

      if (!res.ok) {
        // Revert
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isSoldOut: current } : i))
        )
      } else {
        // Show mini toast
        const name = items.find(i => i.id === itemId)?.name ?? ''
        toast.success(`${name} marked as ${!current ? 'sold out' : 'available'}`)
      }
    } catch (err) {
      console.error('Update failed:', err)
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isSoldOut: current } : i))
      )
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          price: Number(newItem.price)
        }),
      })

      if (res.ok) {
        const { item } = await res.json()
        setItems(prev => [...prev, item])
        toast.success(`${item.name} added successfully!`)
        setIsAddingItem(false)
        setNewItem({ name: '', description: '', price: '', category: 'Snacks', isVeg: true })
      } else {
        toast.error('Failed to add item')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error adding item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCollapse = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const debouncedSearch = useDebounce(search, 300)

  const filteredItems = useMemo(() =>
    items.filter((i) => i.name.toLowerCase().includes(debouncedSearch.toLowerCase())),
    [items, debouncedSearch]
  )

  const grouped = useMemo(() =>
    filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, MenuItem[]>),
    [filteredItems]
  )

  const totalSoldOut = items.filter((i) => i.isSoldOut).length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full p-4 lg:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Menu Management</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {items.length} items &bull;{' '}
              <span className={totalSoldOut > 0 ? 'text-red-400' : 'text-green-400'}>
                {totalSoldOut} sold out
              </span>
            </p>
          </div>

          {/* Actions: Search + Add */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-56 rounded-xl border border-border bg-muted/30 pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            
            <button
              onClick={() => setIsAddingItem(true)}
              className="flex-shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        </div>

        {/* Categories */}
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 blur-[30px] rounded-full animate-pulse" />
              <Search className="relative h-16 w-16 text-primary/60 drop-shadow-lg" />
              <div className="absolute bottom-0 right-0 text-3xl animate-bounce" style={{ animationDuration: '2.5s' }}>🍔</div>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-2">No items found</h3>
            <p className="text-muted-foreground max-w-[250px] mx-auto text-sm">
              No menu items match the search &quot;{search}&quot;.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, catItems], gIdx) => {
            const isCollapsed = collapsed[category]
            const soldOutCount = catItems.filter(i => i.isSoldOut).length
            return (
              <div
                key={category}
                className={`rounded-2xl border border-white/[0.07] bg-card overflow-hidden animate-fade-in-up stagger-${Math.min(gIdx + 1, 5)}`}
              >
                {/* Category header */}
                <button
                  onClick={() => toggleCollapse(category)}
                  className="w-full flex items-center justify-between px-5 py-4 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{CATEGORY_EMOJIS[category] ?? '🍽️'}</span>
                    <span className="font-bold text-base">{category}</span>
                    <span className="text-xs bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5 font-semibold">
                      {catItems.length}
                    </span>
                    {soldOutCount > 0 && (
                      <span className="text-xs bg-red-400/15 text-red-400 rounded-full px-2 py-0.5 font-semibold">
                        {soldOutCount} sold out
                      </span>
                    )}
                  </div>
                  {isCollapsed
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  }
                </button>

                {/* Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-white/[0.04]">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${
                          item.isSoldOut ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Veg dot */}
                          <span className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                            item.isVeg ? 'border-green-500' : 'border-red-500'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                          </span>

                          <div className="min-w-0">
                            <p className={`font-semibold text-sm truncate ${item.isSoldOut ? 'line-through text-muted-foreground' : ''}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">₹{item.price}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {/* Status badge */}
                          {item.isSoldOut ? (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2 py-0.5">
                              <XCircle className="h-3 w-3" /> Sold Out
                            </span>
                          ) : (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Available
                            </span>
                          )}

                          {/* Toggle */}
                          <Switch
                            id={`sold-out-${item.id}`}
                            checked={item.isSoldOut}
                            onCheckedChange={() => toggleSoldOut(item.id, item.isSoldOut)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>


      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-pop">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Add New Item</h2>
              <button 
                onClick={() => setIsAddingItem(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-6 flex flex-col gap-5">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Item Name</label>
                <input 
                  required
                  type="text" 
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Masala Dosa"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Description (Optional)</label>
                <input 
                  type="text" 
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Crispy crepe with potato filling"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors"
                    placeholder="150"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Category</label>
                  <select 
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    {Object.keys(CATEGORY_EMOJIS).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="text-sm font-semibold text-foreground">Vegetarian / Vegan</label>
                <Switch 
                  checked={newItem.isVeg} 
                  onCheckedChange={(c) => setNewItem({...newItem, isVeg: c})} 
                />
              </div>

              <button 
                disabled={isSubmitting}
                type="submit"
                className="w-full mt-4 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Adding...
                  </>
                ) : (
                  'Add Item (Auto-generates Image)'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
