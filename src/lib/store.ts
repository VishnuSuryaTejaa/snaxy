import { create } from 'zustand'

export interface CartItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  customizations?: string
  imageUrl?: string | null
}

interface CartState {
  items: CartItem[]
  userId: string | null
  setUserScope: (userId: string | null) => void
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
}

function getStorageKey(userId: string | null): string {
  return userId ? `snaxy-cart-user-${userId}` : 'snaxy-cart-guest'
}

function loadItemsFromStorage(userId: string | null): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveItemsToStorage(userId: string | null, items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(items))
  } catch {
    // Ignore storage errors
  }
}

export const useCartStore = create<CartState>((set, get) => {
  // Initialize with guest storage on load
  const initialItems = typeof window !== 'undefined' ? loadItemsFromStorage(null) : []

  return {
    items: initialItems,
    userId: null,

    setUserScope: (newUserId: string | null) => {
      const currentUserId = get().userId

      // If user hasn't changed, keep current state
      if (currentUserId === newUserId && get().items.length > 0) return

      let userItems = loadItemsFromStorage(newUserId)

      // When transitioning from guest to logged in user:
      // Transfer any items added during the guest session into the user's private cart
      if (newUserId && !currentUserId) {
        const guestItems = loadItemsFromStorage(null)
        if (guestItems.length > 0) {
          if (userItems.length === 0) {
            userItems = [...guestItems]
          } else {
            // Merge guest items with existing user items
            for (const gItem of guestItems) {
              const existing = userItems.find(
                (i) => i.menuItemId === gItem.menuItemId && i.customizations === gItem.customizations
              )
              if (existing) {
                existing.quantity += gItem.quantity
              } else {
                userItems.push(gItem)
              }
            }
          }
          saveItemsToStorage(newUserId, userItems)
          // Wipe guest cart so next guest / other user starts with an empty tray
          if (typeof window !== 'undefined') {
            localStorage.removeItem(getStorageKey(null))
          }
        }
      }

      set({ userId: newUserId, items: userItems })
    },

    addItem: (item) => {
      const currentItems = get().items
      const currentUserId = get().userId

      const existingIndex = currentItems.findIndex(
        (i) => i.menuItemId === item.menuItemId && i.customizations === item.customizations
      )

      let updatedItems: CartItem[]
      if (existingIndex > -1) {
        updatedItems = currentItems.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      } else {
        const newId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        updatedItems = [...currentItems, { ...item, id: newId }]
      }

      set({ items: updatedItems })
      saveItemsToStorage(currentUserId, updatedItems)
    },

    removeItem: (id) => {
      const currentUserId = get().userId
      const updatedItems = get().items.filter((i) => i.id !== id)
      set({ items: updatedItems })
      saveItemsToStorage(currentUserId, updatedItems)
    },

    updateQuantity: (id, quantity) => {
      const currentUserId = get().userId
      let updatedItems: CartItem[]
      if (quantity <= 0) {
        updatedItems = get().items.filter((i) => i.id !== id)
      } else {
        updatedItems = get().items.map((i) => (i.id === id ? { ...i, quantity } : i))
      }
      set({ items: updatedItems })
      saveItemsToStorage(currentUserId, updatedItems)
    },

    clearCart: () => {
      const currentUserId = get().userId
      set({ items: [] })
      if (typeof window !== 'undefined') {
        localStorage.removeItem(getStorageKey(currentUserId))
      }
    },

    getCartTotal: () => {
      return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
    },
  }
})
