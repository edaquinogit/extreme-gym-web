import { useCallback, useEffect, useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback)
  window.addEventListener('app:navigation', callback)

  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener('app:navigation', callback)
  }
}

function getLocationSnapshot() {
  return `${window.location.pathname}${window.location.search}`
}

function getSearchSnapshot() {
  return window.location.search
}

export function navigateTo(path: string) {
  if (getLocationSnapshot() === path) {
    return
  }

  window.history.pushState(null, '', path)
  window.dispatchEvent(new CustomEvent('app:navigation'))
}

export function useCurrentPath() {
  const location = useSyncExternalStore(subscribe, getLocationSnapshot, getLocationSnapshot)

  return location.split('?')[0]
}

export function useCurrentSearch() {
  return useSyncExternalStore(subscribe, getSearchSnapshot, getSearchSnapshot)
}

export function useNavigate() {
  return useCallback((path: string) => navigateTo(path), [])
}

export function useRedirect(shouldRedirect: boolean, path: string) {
  useEffect(() => {
    if (shouldRedirect) {
      navigateTo(path)
    }
  }, [path, shouldRedirect])
}
