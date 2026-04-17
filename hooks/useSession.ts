import { useSelector } from 'react-redux'
import type { RootState } from '@/lib/redux/store'
import { useMemo } from 'react'

// Main hook that provides all session data
export function useSession() {
  const sessionData = useSelector((state: RootState) => state.session)

  return useMemo(() => {
    const {
      user,
      company,
      branch,
      shopList,
      isSessionLoaded,
      isUnauthorized,
      permissionError,
      sessionUpdateMessage,
      serverError
    } = sessionData

    const isAuthenticated = isSessionLoaded && !!user

    return {
      user,
      company,
      branch,
      shopList,
      isSessionLoaded,
      isUnauthorized,
      permissionError,
      sessionUpdateMessage,
      serverError,
      isAuthenticated,
    }
  }, [sessionData])
}

// Legacy hooks for backward compatibility - can be removed gradually
export function useUser() {
  return useSelector((state: RootState) => state.session.user)
}

export function useShop() {
  // For backward compatibility, return company as shop
  return useSelector((state: RootState) => state.session.company)
}

export function useCompany() {
  return useSelector((state: RootState) => state.session.company)
}

export function useBranch() {
  return useSelector((state: RootState) => state.session.branch)
}

export function useShopList() {
  return useSelector((state: RootState) => state.session.shopList)
}

export function useSessionLoading() {
  return useSelector((state: RootState) => state.session.isSessionLoaded)
}

export function useSessionData() {
  return useSelector((state: RootState) => state.session)
}

export function useIsAuthenticated() {
  const user = useSelector((state: RootState) => state.session.user)
  const isSessionLoaded = useSelector((state: RootState) => state.session.isSessionLoaded)
  return isSessionLoaded && !!user
}
