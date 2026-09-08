import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  Snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  Meals: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  Beverages: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
  Desserts: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const items = await prisma.menuItem.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json({ success: true, items })
  } catch (error: any) {
    console.error('Failed to fetch menu:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { itemId, isSoldOut, name, description, price, category, isVeg, imageUrl } = body

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing itemId' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (typeof isSoldOut === 'boolean') updateData.isSoldOut = isSoldOut
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description ? description.trim() : null
    if (price !== undefined) {
      const numPrice = typeof price === 'number' ? price : parseFloat(price)
      if (!isNaN(numPrice) && numPrice >= 0) updateData.price = numPrice
    }
    if (category) updateData.category = category.trim()
    if (typeof isVeg === 'boolean') updateData.isVeg = isVeg
    if (imageUrl) updateData.imageUrl = imageUrl.trim()

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: updateData,
    })

    return NextResponse.json({ success: true, item })
  } catch (error: any) {
    console.error('Failed to update menu item:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { name, description, price, category, isVeg, imageUrl } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Item name is required' },
        { status: 400 }
      )
    }

    const numPrice = typeof price === 'number' ? price : parseFloat(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid item price greater than 0 is required' },
        { status: 400 }
      )
    }

    const validCategory = category && category.trim() !== '' ? category.trim() : 'Snacks'

    // Use custom image URL, or default category photo
    const finalImageUrl = imageUrl && imageUrl.trim() !== ''
      ? imageUrl.trim()
      : (DEFAULT_CATEGORY_IMAGES[validCategory] || DEFAULT_CATEGORY_IMAGES.Snacks)

    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        description: description && description.trim() !== '' ? description.trim() : null,
        price: numPrice,
        category: validCategory,
        isVeg: Boolean(isVeg),
        imageUrl: finalImageUrl,
        isSoldOut: false,
      },
    })

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create menu item:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create menu item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing item ID parameter' },
        { status: 400 }
      )
    }

    await prisma.menuItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true, message: 'Item deleted successfully' })
  } catch (error: any) {
    console.error('Failed to delete menu item:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}
