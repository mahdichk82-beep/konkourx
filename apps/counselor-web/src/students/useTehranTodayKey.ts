import { useEffect, useState } from 'react'
import { subscribeToTehranDay, tehranDateKey } from '@konkourx/task-presentation'

export function useTehranTodayKey(): string {
  const [todayKey, setTodayKey] = useState(() => tehranDateKey(new Date()))

  useEffect(() => subscribeToTehranDay<number>(setTodayKey, {
    addFocusListener(listener) {
      window.addEventListener('focus', listener)
      return () => window.removeEventListener('focus', listener)
    },
    addVisibilityListener(listener) {
      document.addEventListener('visibilitychange', listener)
      return () => document.removeEventListener('visibilitychange', listener)
    },
    clearTimer: (handle) => window.clearTimeout(handle),
    isVisible: () => document.visibilityState === 'visible',
    now: () => new Date(),
    setTimer: (listener, delayMs) => window.setTimeout(listener, delayMs),
  }), [])

  return todayKey
}
