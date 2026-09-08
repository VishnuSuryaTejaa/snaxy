import { AdminNav } from '@/components/AdminNav'
import { cookies } from 'next/headers'
import { AdminLoginForm } from '@/components/AdminLoginForm'
import { verifyAdminSession, COOKIE_NAME } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const isAdmin = verifyAdminSession(token)

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-black items-center justify-center p-4">
        <AdminLoginForm />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminNav />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
