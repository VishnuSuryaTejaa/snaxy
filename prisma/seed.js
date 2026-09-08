// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Category images — served from /public/images/menu/
const CAT_IMAGES = {
  Snacks: '/images/menu/snacks.jpg',
  Meals: '/images/menu/meals.jpg',
  Beverages: '/images/menu/beverages.jpg',
  Desserts: '/images/menu/desserts.jpg',
}

const menuItems = [
  // Snacks
  { name: 'Samosa (2 pcs)', description: 'Crispy fried pastry filled with spiced potato & peas', price: 20, category: 'Snacks', isVeg: true, imageUrl: CAT_IMAGES.Snacks },
  { name: 'Bread Pakora', description: 'Thick bread slices dipped in spiced chickpea batter, deep fried', price: 25, category: 'Snacks', isVeg: true, imageUrl: CAT_IMAGES.Snacks },
  { name: 'Aloo Tikki', description: 'Golden potato patties with green chutney & tamarind', price: 30, category: 'Snacks', isVeg: true, imageUrl: CAT_IMAGES.Snacks },
  { name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled with bell peppers and onions', price: 80, category: 'Snacks', isVeg: true, imageUrl: CAT_IMAGES.Snacks },
  { name: 'Chicken Roll', description: 'Flaky paratha rolled with spicy chicken tikka & onions', price: 70, category: 'Snacks', isVeg: false, imageUrl: CAT_IMAGES.Snacks },
  { name: 'Puff Pastry (Veg)', description: 'Flaky pastry stuffed with spiced mixed vegetables', price: 18, category: 'Snacks', isVeg: true, imageUrl: CAT_IMAGES.Snacks },

  // Meals
  { name: 'Maggi Masala', description: 'Classic Maggi noodles cooked with veggies and spices', price: 35, category: 'Meals', isVeg: true, imageUrl: CAT_IMAGES.Meals },
  { name: 'Chole Bhature', description: 'Spicy chickpea curry with two fluffy bhature', price: 60, category: 'Meals', isVeg: true, imageUrl: CAT_IMAGES.Meals },
  { name: 'Veg Sandwich', description: 'Grilled sandwich with fresh veggies, cheese & mint chutney', price: 45, category: 'Meals', isVeg: true, imageUrl: CAT_IMAGES.Meals },
  { name: 'Egg Biryani', description: 'Fragrant basmati rice cooked with boiled eggs and whole spices', price: 80, category: 'Meals', isVeg: false, imageUrl: CAT_IMAGES.Meals },
  { name: 'Dal Makhani + Rice', description: 'Slow-cooked black lentils in tomato-butter gravy with steamed rice', price: 90, category: 'Meals', isVeg: true, imageUrl: CAT_IMAGES.Meals },

  // Beverages
  { name: 'Masala Chai', description: 'Freshly brewed Indian spiced milk tea', price: 15, category: 'Beverages', isVeg: true, imageUrl: CAT_IMAGES.Beverages },
  { name: 'Cold Coffee', description: 'Blended cold coffee with milk and ice cream — thick & creamy', price: 50, category: 'Beverages', isVeg: true, imageUrl: CAT_IMAGES.Beverages },
  { name: 'Lassi (Sweet)', description: 'Chilled yogurt blended with sugar and a hint of cardamom', price: 40, category: 'Beverages', isVeg: true, imageUrl: CAT_IMAGES.Beverages },
  { name: 'Fresh Lime Soda', description: 'Freshly squeezed lime with soda, salt or sweet — your choice', price: 30, category: 'Beverages', isVeg: true, imageUrl: CAT_IMAGES.Beverages },
  { name: 'Mango Shake', description: 'Thick Alphonso mango shake with a scoop of vanilla ice cream', price: 60, category: 'Beverages', isVeg: true, imageUrl: CAT_IMAGES.Beverages },

  // Desserts
  { name: 'Gulab Jamun (2 pcs)', description: 'Soft milk-solid dumplings soaked in rose-cardamom sugar syrup', price: 30, category: 'Desserts', isVeg: true, imageUrl: CAT_IMAGES.Desserts },
  { name: 'Kulfi (Matka)', description: 'Traditional Indian ice cream in a clay pot — kesar pista flavour', price: 45, category: 'Desserts', isVeg: true, imageUrl: CAT_IMAGES.Desserts },
  { name: 'Gajar Ka Halwa', description: 'Slow-cooked carrot pudding with ghee, milk, and dry fruits', price: 50, category: 'Desserts', isVeg: true, imageUrl: CAT_IMAGES.Desserts },
]

async function main() {
  console.log('🌱 Seeding database with menu items...')

  await prisma.menuItem.deleteMany()
  console.log('  Cleared existing menu items')

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item })
  }

  console.log(`  ✅ Seeded ${menuItems.length} menu items with real food images`)
  console.log('\nCategories:')
  const categories = [...new Set(menuItems.map(i => i.category))]
  categories.forEach(cat => {
    const count = menuItems.filter(i => i.category === cat).length
    console.log(`  ${cat}: ${count} items`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
