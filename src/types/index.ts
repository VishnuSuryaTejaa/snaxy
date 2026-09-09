export type OrderItem = {
  id: string
  quantity: number
  price: number
  customizations?: string | null
  menuItem: {
    name: string
    imageUrl?: string | null
    category?: string
  }
}

export type Order = {
  id: string
  shortCode?: string | null
  customerName: string
  customerPhone: string
  deliveryType: string
  deliveryAddress: string | null
  orderNotes?: string | null
  totalAmount: number
  paymentMethod: string
  upiUtr: string | null
  payerName?: string | null
  paymentScreenshot?: string | null
  duplicateUtrFlag?: boolean
  deliveryContactPhone?: string | null
  estimatedTime?: string | null
  status: string
  createdAt: string
  items: OrderItem[]
}

export type Stats = {
  totalToday: number
  revenueToday: number
  pending: number
  preparing: number
  ready: number
}

export type AdminNotificationItem = {
  id: string
  type: string
  orderId?: string | null
  title: string
  message: string
  read: boolean
  createdAt: string
}
