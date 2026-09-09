'use client'

import { MenuItem } from '@prisma/client'
import Image from 'next/image'
import { useCartStore } from '@/lib/store'
import { Plus, Minus, Flame } from 'lucide-react'
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
  const [imgError, setImgError] = useState(false)

  const showImage = Boolean(item.imageUrl && !imgError)

  return (
    <div
      className={`group relative flex flex-col rounded-3xl overflow-hidden bg-slate-950/75 backdrop-blur-xl border border-white/[0.07] hover:border-primary/40 transition-all duration-300 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_45px_-12px_rgba(255,85,0,0.22)] hover:-translate-y-1.5 ${
        item.isSoldOut ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Inset Image Frame for modern human-crafted proportions */}
      <div className="relative aspect-[16/11] w-[calc(100%-1rem)] mx-auto mt-2 overflow-hidden rounded-2xl bg-slate-900/80 border border-white/[0.06]">
        {showImage ? (
          <>
            {isImageLoading && <div className="absolute inset-0 shimmer z-10" />}
            <Image
              src={item.imageUrl!}
              alt={item.name}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover transition-transform duration-500 ease-out group-hover:scale-108 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setIsImageLoading(false)
                setImgError(true)
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <span className="text-4xl group-hover:scale-115 transition-transform duration-300">
              {item.isVeg ? '🥗' : '🍗'}
            </span>
          </div>
        )}

        {/* Soft atmospheric gradient on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

        {/* Sold-out Overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-20">
            <span className="text-[11px] font-black tracking-widest text-rose-400 uppercase border border-rose-500/40 rounded-full px-3 py-1 bg-rose-950/70 font-sans shadow-lg">
              Sold Out
            </span>
          </div>
        )}

        {/* Category Pill Tag */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/65 backdrop-blur-md text-slate-200 border border-white/10 shadow-sm font-sans tracking-wide">
            {item.category}
          </span>
        </div>

        {/* Standard Indian Culinary Diet Symbol (Veg / Non-Veg) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <div
            className={`w-5 h-5 rounded-md border-1.5 flex items-center justify-center bg-black/75 backdrop-blur-md shadow-md ${
              item.isVeg
                ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)]'
                : 'border-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.35)]'
            }`}
            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                item.isVeg ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4 pt-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-extrabold text-base sm:text-lg leading-snug text-white group-hover:text-orange-400 transition-colors line-clamp-1">
            {item.name}
          </h3>
          {item.description ? (
            <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2 font-sans min-h-[2rem]">
              {item.description}
            </p>
          ) : (
            <div className="min-h-[2rem]" />
          )}
        </div>

        {/* Price + Action Row with optical alignment */}
        <div className="flex items-center justify-between gap-3 pt-2 mt-auto border-t border-white/[0.06]">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs font-bold text-orange-400 font-sans">₹</span>
            <span className="font-display font-black text-xl text-white tracking-tight">
              {item.price.toFixed(0)}
            </span>
          </div>

          {item.isSoldOut ? null : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 hover:from-primary/95 hover:to-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,85,0,0.35)] hover:shadow-[0_0_22px_rgba(255,85,0,0.55)] hover:scale-105 active:scale-95 transition-all duration-200 border border-white/15 font-sans"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center rounded-xl border border-primary/50 bg-primary/15 p-0.5 shadow-[0_0_15px_rgba(255,85,0,0.25)]">
              <button
                onClick={() =>
                  quantity > 1
                    ? updateQuantity(cartItem!.id, quantity - 1)
                    : removeItem(cartItem!.id)
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-200 hover:text-white hover:bg-primary transition-all active:scale-90"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3 stroke-[2.5]" />
              </button>
              <span className="w-6 text-center text-xs font-black text-white font-mono">
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-200 hover:text-white hover:bg-primary transition-all active:scale-90"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
