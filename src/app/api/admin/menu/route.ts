import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const items = await prisma.menuItem.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Failed to fetch menu:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { itemId, isSoldOut } = body

    if (!itemId || typeof isSoldOut !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Missing itemId or isSoldOut' },
        { status: 400 }
      )
    }

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: { isSoldOut },
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Failed to update menu item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { name, description, price, category, isVeg } = body

    if (!name || typeof price !== 'number' || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Auto-generate image using the item name
    const prompt = `${name} delicious food photography`
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=600&height=400&nologo=true`

    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price,
        category,
        isVeg: Boolean(isVeg),
        imageUrl,
        isSoldOut: false,
      },
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Failed to create menu item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}
