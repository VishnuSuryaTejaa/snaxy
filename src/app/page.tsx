import { prisma } from '@/lib/db'
import { MenuClient } from '@/components/menu/MenuClient'
import { Hero } from '@/components/Hero'

export default async function Home() {
  const menuItems = await prisma.menuItem.findMany({
    where: { isSoldOut: false },
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  })

  return (
    <main className="min-h-screen bg-black">
      <Hero />
      <div id="menu" className="pt-8">
        <MenuClient menuItems={menuItems} />
      </div>
    </main>
  )
}
