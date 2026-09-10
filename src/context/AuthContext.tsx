'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useCartStore } from '@/lib/store'

export interface AuthUser {
  id: string
  name: string
  phone: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoggedIn: boolean
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  logout: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await res.json()
      if (data.success && data.user) {
        setUser(data.user)
        useCartStore.getState().setUserScope(data.user.id)
      } else {
        setUser(null)
        useCartStore.getState().setUserScope(null)
      }
    } catch {
      setUser(null)
      useCartStore.getState().setUserScope(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore network errors
    } finally {
      setUser(null)
      // Switch cart store to guest scope & empty cart
      useCartStore.getState().setUserScope(null)
      useCartStore.getState().clearCart()

      // Clean guest/session caches
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('snaxy_active_order')
          localStorage.removeItem('snaxy_recent_orders')
          localStorage.removeItem('snaxy_last_phone')
          localStorage.removeItem('snaxy_last_name')
        } catch {
          // Ignore storage errors
        }
      }
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
