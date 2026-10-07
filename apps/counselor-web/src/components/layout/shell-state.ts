export type MobileNavigationAction = 'close' | 'navigate' | 'open' | 'toggle'

export function mobileNavigationState(current: boolean, action: MobileNavigationAction) {
  if (action === 'open') return true
  if (action === 'toggle') return !current
  return false
}

export function isNavigationItemActive(currentPath: string, itemPath: string) {
  return currentPath === itemPath
}

export function nextTheme(theme: 'dark' | 'light') {
  return theme === 'light' ? 'dark' : 'light'
}
