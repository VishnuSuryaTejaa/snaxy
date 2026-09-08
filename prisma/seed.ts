import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)
  
  // Clear existing items just in case
  await prisma.menuItem.deleteMany({})

  const items = [
    {
      name: 'Veg Puff',
      description: 'Flaky pastry filled with spiced mixed vegetables.',
      price: 35,
      category: 'Snacks',
      isVeg: true,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80',
    },
    {
      name: 'Cold Coffee',
      description: 'Refreshing blended cold coffee.',
      price: 90,
      category: 'Beverages',
      isVeg: true,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80',
    },
    {
      name: 'Chicken Burger',
      description: 'Juicy chicken patty with fresh lettuce and mayo.',
      price: 150,
      category: 'Meals',
      isVeg: false,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
    },
    {
      name: 'French Fries',
      description: 'Crispy golden fries with a side of ketchup.',
      price: 70,
      category: 'Snacks',
      isVeg: true,
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80',
    }
  ]

  for (const item of items) {
    const menuItem = await prisma.menuItem.create({
      data: item,
    })
    console.log(`Created menu item with id: ${menuItem.id}`)
  }
  
  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
