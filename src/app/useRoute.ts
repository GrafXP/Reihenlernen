import { TABLES } from '../curriculum/skills'
import type { TableNumber } from '../domain/types'
import { useCallback, useEffect, useState } from 'react'

export type AppRoute = '/' | '/rewards' | '/choose' | '/mission' | '/done' | '/parent' | `/learn/${TableNumber}`

function safeRoute(pathname: string): AppRoute {
  if (/^\/learn\/\d+$/.test(pathname) && TABLES.includes(Number(pathname.split('/')[2]) as TableNumber)) return pathname as AppRoute
  if (pathname === '/rewards' || pathname === '/choose' || pathname === '/mission' || pathname === '/done' || pathname === '/parent') {
    return pathname
  }
  return '/'
}

export function useRoute(): [AppRoute, (route: AppRoute) => void] {
  const [route, setRoute] = useState<AppRoute>(() => safeRoute(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setRoute(safeRoute(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((next: AppRoute) => {
    if (window.location.pathname !== next) window.history.pushState({}, '', next)
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return [route, navigate]
}
