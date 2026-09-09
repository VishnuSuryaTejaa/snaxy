import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { OrderTrackerClient, SerializedOrder } from '@/components/order/OrderTrackerClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { menuItem: true },
      },
    },
  })

  if (!order) notFound()

  // Format serializable order structure
  const serializedOrder: SerializedOrder = {
    id: order.id,
    shortCode: order.shortCode,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress,
    orderNotes: order.orderNotes,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    status: order.status,
    upiUtr: order.upiUtr,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      price: i.price,
      menuItem: {
        id: i.menuItem.id,
        name: i.menuItem.name,
        price: i.menuItem.price,
        imageUrl: i.menuItem.imageUrl,
        isVeg: i.menuItem.isVeg,
      },
    })),
  }

  return <OrderTrackerClient initialOrder={serializedOrder} />
}
