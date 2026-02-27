"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import Cookies from 'js-cookie'
import { useRouter, usePathname } from 'next/navigation'
import { setSessionData, clearSessionData } from '@/lib/redux/sessionSlice'
import type { AppDispatch } from '@/lib/redux/store'
import { settings } from '@/lib/api/settings'
import { showToast } from '../toast'

interface SessionContextType {
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()
  const [isLoading, setIsLoading] = useState(false)
  const [getSessionData] = settings.useGetSessionDataMutation();

  const loadSessionData = async () => {

    const token = Cookies.get("token")
    if (!token) {
      console.log("❌ Missing token, clearing session and returning");
      dispatch(clearSessionData());
      
      // Only redirect to login if not already on public auth pages
      const publicRoutes = ['/login', '/signup', '/forgot-password', '/register']
      if (!publicRoutes.some(route => pathname.startsWith(route))) {
        router.push("/login")
      }
      return
    }

    setIsLoading(true)
    try {
      const sessionResponse = await getSessionData({}) as any

      if (sessionResponse?.data?.data) {
        const data = sessionResponse.data.data
        dispatch(setSessionData(data))

        Cookies.set("token", token, { expires: 1, path: "/" });
      } else {
        // console.error("Session data fetch failed or empty", sessionResponse);
        clearSession();
        router.push("/login")
      }
    } catch (error) {
      console.error("Session load failed", error)
      showToast.error(typeof error === 'string' ? error : "Session load failed")
      clearSession()
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    await loadSessionData()
  }

  const router = useRouter()
  const pathname = usePathname()

  const clearSession = () => {
    dispatch(clearSessionData())
    Cookies.remove("token", { path: "/" })
    Cookies.remove("refresh_token", { path: "/" })

    const publicRoutes = ['/login', '/signup', '/forgot-password']
    if (!publicRoutes.some(route => pathname.startsWith(route))) {
      router.push("/login")
    }
  }

  useEffect(() => {
    loadSessionData()
  }, [])

  const value = {
    isLoading,
    refreshSession,
    clearSession,
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}
