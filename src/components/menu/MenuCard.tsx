'use client'

import { MenuItem } from '@prisma/client'
import Image from 'next/image'
import { useCartStore } from '@/lib/store'
import { Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface MenuCardProps {
  item: MenuItem
}

export function MenuCard({ item }: MenuCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCartStore()

  const cartItem = items.find((i) => i.menuItemId === item.id)
  const quantity = cartItem?.quantity ?? 0

  const handleAdd = () =>
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
    })

  const [isImageLoading, setIsImageLoading] = useState(true)

  return (
    <div
      className={`group relative flex flex-col rounded-3xl overflow-hidden glass-card-hover ${
        item.isSoldOut ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Image container with gradient vignettes */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900/60">
        {item.imageUrl ? (
          <>
            {isImageLoading && <div className="absolute inset-0 shimmer z-10" />}
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setIsImageLoading(false)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <span className="text-5xl group-hover:scale-125 transition-transform duration-300">
              {item.isVeg ? '🥗' : '🍗'}
            </span>
          </div>
        )}

        {/* Soft bottom vignette on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Sold-out Overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
            <span className="text-xs font-black tracking-widest text-rose-400 uppercase border border-rose-500/40 rounded-full px-4 py-1.5 bg-rose-950/60 font-sans">
              Sold Out
            </span>
          </div>
        )}

        {/* Category Chip */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-slate-200 border border-white/10 shadow-sm font-sans">
            {item.category}
          </span>
        </div>

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 bg-black/70 backdrop-blur-md shadow-md ${
              item.isVeg ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                item.isVeg ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-base sm:text-lg leading-snug text-white group-hover:text-orange-400 transition-colors font-display">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-2 font-sans font-normal">
              {item.description}
            </p>
          )}
        </div>

        {/* Price + Action Row */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-white/[0.06]">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Price</span>
            <span className="font-black text-xl text-white font-display tracking-tight">
              ₹{item.price.toFixed(0)}
            </span>
          </div>

          {item.isSoldOut ? null : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-primary to-rose-500 px-4 py-2.5 text-xs font-black text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(255,94,14,0.5)] transition-all duration-200 active:scale-95 shadow-md border border-white/15 font-display"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center rounded-2xl border border-primary/40 bg-primary/10 p-0.5 shadow-[0_0_15px_rgba(255,94,14,0.2)]">
              <button
                onClick={() =>
                  quantity > 1
                    ? updateQuantity(cartItem!.id, quantity - 1)
                    : removeItem(cartItem!.id)
                }
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white hover:bg-primary hover:text-white transition-all active:scale-90"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5 stroke-[3]" />
              </button>
              <span className="w-7 text-center text-sm font-black text-white font-mono">
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white hover:bg-primary hover:text-white transition-all active:scale-90"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
