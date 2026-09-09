import { MyOrdersClient } from '@/components/orders/MyOrdersClient'

export const metadata = {
  title: 'My Orders & Live Kitchen Tracker | Snaxy',
  description: 'Track live status and review your recent campus snack orders in real time.',
}

export const dynamic = 'force-dynamic'

export default function OrdersPage() {
  return <MyOrdersClient />
}
