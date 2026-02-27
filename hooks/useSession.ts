import { useSelector } from 'react-redux'
import type { RootState } from '@/lib/redux/store'
import { useMemo } from 'react'

// Main hook that provides all session data
export function useSession() {
  const sessionData = useSelector((state: RootState) => state.session)
  
  return useMemo(() => {
    const {
      user,
      shop,
      shopList,
      menus,
      modules,
      permissions,
      isSessionLoaded,
      isUnauthorized,
      permissionError,
      sessionUpdateMessage,
      serverError
    } = sessionData

    // Helper functions
    const hasPermission = (permissionCode: string) => 
      permissions.some(permission => permission.code === permissionCode)
    
    const hasModule = (moduleCode: string) => 
      modules.some(module => module.code === moduleCode)
    
    const isAuthenticated = isSessionLoaded && !!user

    return {
      // Raw data
      user,
      shop,
      shopList,
      menus,
      modules,
      permissions,
      isSessionLoaded,
      isUnauthorized,
      permissionError,
      sessionUpdateMessage,
      serverError,
      
      // Computed values
      isAuthenticated,
      
      // Helper functions
      hasPermission,
      hasModule,
    }
  }, [sessionData])
}

// Legacy hooks for backward compatibility - can be removed gradually
export function useUser() {
  return useSelector((state: RootState) => state.session.user)
}

export function useShop() {
  return useSelector((state: RootState) => state.session.shop)
}

export function useShopList() {
  return useSelector((state: RootState) => state.session.shopList)
}

export function useMenus() {
  return useSelector((state: RootState) => state.session.menus)
}

export function useModules() {
  return useSelector((state: RootState) => state.session.modules)
}

export function usePermissions() {
  return useSelector((state: RootState) => state.session.permissions)
}

export function useHasPermission(permissionCode: string) {
  const permissions = useSelector((state: RootState) => state.session.permissions)
  return permissions.some(permission => permission.code === permissionCode)
}

export function useHasModule(moduleCode: string) {
  const modules = useSelector((state: RootState) => state.session.modules)
  return modules.some(module => module.code === moduleCode)
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
