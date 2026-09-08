import { prisma } from '@/lib/db'
import { MenuClient } from '@/components/menu/MenuClient'
import { Hero } from '@/components/Hero'

const FALLBACK_MENU_ITEMS = [
  {
    id: 'item-veg-puff',
    name: 'Veg Puff',
    description: 'Flaky pastry filled with spiced mixed vegetables.',
    price: 35,
    category: 'Snacks',
    isVeg: true,
    isSoldOut: false,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-cold-coffee',
    name: 'Cold Coffee',
    description: 'Refreshing blended cold coffee.',
    price: 90,
    category: 'Beverages',
    isVeg: true,
    isSoldOut: false,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-chicken-burger',
    name: 'Chicken Burger',
    description: 'Juicy chicken patty with fresh lettuce and mayo.',
    price: 150,
    category: 'Meals',
    isVeg: false,
    isSoldOut: false,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-french-fries',
    name: 'French Fries',
    description: 'Crispy golden fries with a side of ketchup.',
    price: 70,
    category: 'Snacks',
    isVeg: true,
    isSoldOut: false,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default async function Home() {
  let menuItems: typeof FALLBACK_MENU_ITEMS = []
  try {
    menuItems = await prisma.menuItem.findMany({
      where: { isSoldOut: false },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    if (menuItems.length === 0) {
      menuItems = FALLBACK_MENU_ITEMS
    }
  } catch (error) {
    console.error('Failed to load menu items from database, using fallback:', error)
    menuItems = FALLBACK_MENU_ITEMS
  }

  return (
    <main className="min-h-screen bg-black">
      <Hero />
      <div id="menu" className="pt-8">
        <MenuClient menuItems={menuItems} />
      </div>
    </main>
  )
}
