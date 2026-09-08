import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log(`Starting database seed...`)

  // Check if items already exist
  const existingCount = await prisma.menuItem.count()
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} items. Skipping initial seed.`)
    return
  }

  const items = [
    {
      name: 'Veg Puff',
      description: 'Flaky pastry filled with spiced mixed vegetables.',
      price: 35,
      category: 'Snacks',
      isVeg: true,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
    },
    {
      name: 'Cold Coffee',
      description: 'Refreshing blended cold coffee with creamy texture.',
      price: 90,
      category: 'Beverages',
      isVeg: true,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
    },
    {
      name: 'Chicken Burger',
      description: 'Juicy crispy chicken patty with fresh lettuce and mayo.',
      price: 150,
      category: 'Meals',
      isVeg: false,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    },
    {
      name: 'French Fries',
      description: 'Crispy salted golden fries with a side of ketchup.',
      price: 70,
      category: 'Snacks',
      isVeg: true,
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&q=80',
    },
    {
      name: 'Paneer Roll',
      description: 'Warm roll loaded with spiced cottage cheese and peppers.',
      price: 110,
      category: 'Snacks',
      isVeg: true,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&q=80',
    },
    {
      name: 'Chocolate Brownie',
      description: 'Warm fudge chocolate brownie with rich cocoa.',
      price: 85,
      category: 'Desserts',
      isVeg: true,
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
    },
  ]

  for (const item of items) {
    const created = await prisma.menuItem.create({
      data: item,
    })
    console.log(`✅ Created menu item: ${created.name} (id: ${created.id})`)
  }

  console.log(`✨ Seeding completed successfully.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seeding error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
