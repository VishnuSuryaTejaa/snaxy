import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('snaxy_user_session')
  response.cookies.delete('snaxy_admin_session')
  return response
}
