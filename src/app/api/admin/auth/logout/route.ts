import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('snaxy_admin_session')
  cookieStore.delete('snaxy_user_session')

  return NextResponse.json({ success: true })
}
