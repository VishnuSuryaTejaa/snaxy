'use client'

import { useState, useEffect, useMemo } from 'react'
import { Switch } from '@/components/ui/switch'
import { Search, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, XCircle, Plus, Loader2, Trash2, Image as ImageIcon } from 'lucide-react'
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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Snacks',
    imageUrl: '',
    isVeg: true,
  })

  const loadMenu = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/menu')
      const data = await res.json()
      if (res.ok && data.success) {
        setItems(data.items || [])
      } else {
        toast.error(data.error || 'Failed to load menu items. Please check if you are logged in.')
      }
    } catch (err: any) {
      console.error('Failed to fetch menu:', err)
      toast.error('Network error loading menu items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMenu()
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

      const data = await res.json()
      if (!res.ok || !data.success) {
        // Revert
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isSoldOut: current } : i))
        )
        toast.error(data.error || 'Failed to update item status')
      } else {
        const name = items.find((i) => i.id === itemId)?.name ?? 'Item'
        toast.success(`${name} marked as ${!current ? 'sold out' : 'available'}`)
      }
    } catch (err) {
      console.error('Update failed:', err)
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isSoldOut: current } : i))
      )
      toast.error('Network error updating item')
    }
  }

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return

    setDeletingId(itemId)
    try {
      const res = await fetch(`/api/admin/menu?id=${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId))
        toast.success(`Deleted ${itemName}`)
      } else {
        toast.error(data.error || 'Failed to delete item')
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Error deleting item')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name.trim()) {
      toast.error('Please enter an item name')
      return
    }

    const priceNum = parseFloat(newItem.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price greater than 0')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name.trim(),
          description: newItem.description.trim() || undefined,
          price: priceNum,
          category: newItem.category,
          imageUrl: newItem.imageUrl.trim() || undefined,
          isVeg: newItem.isVeg,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setItems((prev) => [...prev, data.item])
        toast.success(`${data.item.name} added successfully!`)
        setIsAddingItem(false)
        setNewItem({
          name: '',
          description: '',
          price: '',
          category: 'Snacks',
          imageUrl: '',
          isVeg: true,
        })
      } else {
        toast.error(data.error || 'Failed to add item')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error adding item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCollapse = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const debouncedSearch = useDebounce(search, 300)

  const filteredItems = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(debouncedSearch.toLowerCase())),
    [items, debouncedSearch]
  )

  const grouped = useMemo(
    () =>
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
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading menu items...</p>
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
              className="flex-shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Categories */}
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-card/50 p-8 animate-fade-in">
            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
              <Search className="relative h-12 w-12 text-primary/60" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-1">No items found</h3>
            <p className="text-muted-foreground max-w-sm text-sm mb-6">
              {search ? `No items match "${search}".` : 'No menu items exist in the database yet.'}
            </p>
            <button
              onClick={() => setIsAddingItem(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Your First Item
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([category, catItems], gIdx) => {
            const isCollapsed = collapsed[category]
            const soldOutCount = catItems.filter((i) => i.isSoldOut).length
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
                    <span className="text-xs bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5 font-semibold">
                      {catItems.length}
                    </span>
                    {soldOutCount > 0 && (
                      <span className="text-xs bg-red-400/15 text-red-400 rounded-full px-2.5 py-0.5 font-semibold">
                        {soldOutCount} sold out
                      </span>
                    )}
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  )}
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
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Item thumbnail */}
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          )}

                          {/* Veg dot */}
                          <span
                            className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                              item.isVeg ? 'border-green-500' : 'border-red-500'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}
                            />
                          </span>

                          <div className="min-w-0">
                            <p
                              className={`font-semibold text-sm truncate ${
                                item.isSoldOut ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">₹{item.price}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground/70 truncate max-w-xs sm:max-w-md mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {/* Status badge */}
                          {item.isSoldOut ? (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2.5 py-0.5">
                              <XCircle className="h-3 w-3" /> Sold Out
                            </span>
                          ) : (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2.5 py-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Available
                            </span>
                          )}

                          {/* Toggle */}
                          <Switch
                            id={`sold-out-${item.id}`}
                            checked={item.isSoldOut}
                            onCheckedChange={() => toggleSoldOut(item.id, item.isSoldOut)}
                          />

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            disabled={deletingId === item.id}
                            className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                            title="Delete item"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
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
              <h2 className="text-xl font-bold tracking-tight">Add New Menu Item</h2>
              <button
                onClick={() => setIsAddingItem(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Item Name *
                </label>
                <input
                  required
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Masala Dosa"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Crispy golden crepe with potato masala"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Price (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="any"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors font-mono"
                    placeholder="120"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Category *
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  >
                    {Object.keys(CATEGORY_EMOJIS).map((cat) => (
                      <option key={cat} value={cat} className="bg-card text-foreground">
                        {CATEGORY_EMOJIS[cat]} {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Image URL (Optional)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={newItem.imageUrl}
                    onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-semibold text-foreground">Vegetarian Item</p>
                  <p className="text-xs text-muted-foreground">Mark green dot for veg, red for non-veg</p>
                </div>
                <Switch
                  checked={newItem.isVeg}
                  onCheckedChange={(c) => setNewItem({ ...newItem, isVeg: c })}
                />
              </div>

              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full mt-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Saving Item to Database...
                  </>
                ) : (
                  'Save Item to Database'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
