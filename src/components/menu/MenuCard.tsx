'use client'

import { MenuItem } from '@prisma/client'
import Image from 'next/image'
import { useCartStore } from '@/lib/store'
import { Plus, Minus, ShoppingBag } from 'lucide-react'
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
      className={`group relative flex flex-col rounded-2xl overflow-hidden border border-white/[0.07] bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_oklch(0_0_0/40%)] hover:border-white/[0.12] ${
        item.isSoldOut ? 'opacity-60' : ''
      }`}
    >
      {/* Image or placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
        {item.imageUrl ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 shimmer z-10" />
            )}
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-30 group-hover:opacity-50 transition-opacity">
              {item.isVeg ? '🥗' : '🍗'}
            </span>
          </div>
        )}

        {/* Sold-out overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase border border-muted-foreground/30 rounded-full px-3 py-1">
              Sold Out
            </span>
          </div>
        )}

        {/* Category chip */}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm text-muted-foreground border border-white/[0.08]">
            {item.category}
          </span>
        </div>

        {/* Veg / Non-veg indicator */}
        <div className="absolute top-2 right-2">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded border-2 bg-background/80 backdrop-blur-sm ${
              item.isVeg ? 'border-diet-veg' : 'border-diet-nonveg'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${item.isVeg ? 'bg-diet-veg' : 'bg-diet-nonveg'}`}
            />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-base leading-tight tracking-tight">{item.name}</h3>
          {item.description && (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Price + cart control */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span className="font-extrabold text-primary text-lg">₹{item.price}</span>

          {item.isSoldOut ? null : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 rounded-xl bg-primary/15 border border-primary/25 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 active:scale-95"
            >
              <ShoppingBag className="h-3 w-3" />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-muted/50">
              <button
                onClick={() =>
                  quantity > 1
                    ? updateQuantity(cartItem!.id, quantity - 1)
                    : removeItem(cartItem!.id)
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all active:scale-90"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center text-sm font-bold text-primary">{quantity}</span>
              <button
                onClick={handleAdd}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all active:scale-90"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
