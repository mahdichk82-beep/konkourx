import { useCallback, useEffect, useRef, useState } from 'react'

const historyIndexKey = '__konkourxNavigationIndex'

const normalizePath = (path: string) =>
  path.length > 1 ? path.replace(/\/+$/, '') : '/'

const historyIndex = (state: unknown): number | null => {
  if (!state || typeof state !== 'object') return null
  const value = (state as Record<string, unknown>)[historyIndexKey]
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

const historyStateWithIndex = (state: unknown, index: number) => ({
  ...(state && typeof state === 'object' ? state : {}),
  [historyIndexKey]: index,
})

export type BrowserNavigationOptions = {
  preserveScroll?: boolean
}

export type BrowserNavigationAttempt = {
  nextPath: string
  proceed(): void
}

export type BrowserNavigationBlocker = (attempt: BrowserNavigationAttempt) => boolean

export type BrowserNavigate = (
  nextPath: string,
  replace?: boolean,
  options?: BrowserNavigationOptions,
) => boolean

export function useBrowserRouter() {
  const initialRouteRef = useRef<{ index: number; path: string } | null>(null)
  if (initialRouteRef.current === null) {
    const path = normalizePath(window.location.pathname)
    const existingIndex = historyIndex(window.history.state)
    const index = existingIndex ?? 0
    if (existingIndex === null) {
      window.history.replaceState(historyStateWithIndex(window.history.state, index), '')
    }
    initialRouteRef.current = { index, path }
  }

  const [path, setPath] = useState(initialRouteRef.current.path)
  const pathRef = useRef(path)
  const indexRef = useRef(initialRouteRef.current.index)
  const blockerRef = useRef<BrowserNavigationBlocker | null>(null)
  const popModeRef = useRef<'PROCEED' | 'RESTORE' | null>(null)
  const blockedPopRef = useRef<{
    delta: number
    nextIndex: number
    nextPath: string
    proceedRequested: boolean
  } | null>(null)

  const setCurrentPath = useCallback((nextPath: string, nextIndex: number) => {
    pathRef.current = nextPath
    indexRef.current = nextIndex
    setPath(nextPath)
  }, [])

  useEffect(() => {
    const continueBlockedPop = () => {
      const blocked = blockedPopRef.current
      if (!blocked) return
      popModeRef.current = 'PROCEED'
      window.history.go(-blocked.delta)
    }

    const updatePath = (event: PopStateEvent) => {
      const nextPath = normalizePath(window.location.pathname)
      const nextIndex = historyIndex(event.state)

      if (popModeRef.current === 'RESTORE') {
        popModeRef.current = null
        if (nextIndex !== null) indexRef.current = nextIndex
        if (blockedPopRef.current?.proceedRequested) continueBlockedPop()
        return
      }

      if (popModeRef.current === 'PROCEED') {
        popModeRef.current = null
        const blocked = blockedPopRef.current
        blockedPopRef.current = null
        setCurrentPath(nextPath, nextIndex ?? blocked?.nextIndex ?? indexRef.current)
        return
      }

      const currentIndex = indexRef.current
      const effectiveNextIndex = nextIndex ?? currentIndex - 1
      const delta = currentIndex - effectiveNextIndex
      const blocker = blockerRef.current

      if (blocker && delta !== 0) {
        const blocked = {
          delta,
          nextIndex: effectiveNextIndex,
          nextPath,
          proceedRequested: false,
        }
        const shouldBlock = blocker({
          nextPath,
          proceed: () => {
            blocked.proceedRequested = true
            if (popModeRef.current !== 'RESTORE') continueBlockedPop()
          },
        })
        if (shouldBlock) {
          blockedPopRef.current = blocked
          popModeRef.current = 'RESTORE'
          window.history.go(delta)
          return
        }
      }

      blockedPopRef.current = null
      setCurrentPath(nextPath, effectiveNextIndex)
    }

    window.addEventListener('popstate', updatePath)
    return () => window.removeEventListener('popstate', updatePath)
  }, [setCurrentPath])

  const setNavigationBlocker = useCallback((blocker: BrowserNavigationBlocker | null) => {
    blockerRef.current = blocker
    return () => {
      if (blockerRef.current === blocker) blockerRef.current = null
    }
  }, [])

  const navigate = useCallback<BrowserNavigate>((nextPath, replace = false, options = {}) => {
    const normalized = normalizePath(nextPath)
    if (normalized === pathRef.current && !replace) return true

    const commit = () => {
      const nextIndex = replace ? indexRef.current : indexRef.current + 1
      const nextState = historyStateWithIndex(window.history.state, nextIndex)
      window.history[replace ? 'replaceState' : 'pushState'](nextState, '', normalized)
      setCurrentPath(normalized, nextIndex)
      if (!options.preserveScroll) window.scrollTo({ top: 0, behavior: 'auto' })
    }

    const blocker = blockerRef.current
    if (blocker && blocker({ nextPath: normalized, proceed: commit })) return false
    commit()
    return true
  }, [setCurrentPath])

  return { navigate, path, setNavigationBlocker }
}
