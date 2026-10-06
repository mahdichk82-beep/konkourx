import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { AuthUser, PersonProfile } from '../auth/auth-client.ts'
import { accountMenuState, deriveDisplayName, deriveInitials, nextAccountMenuItemIndex } from './profile-state.ts'
import './account-menu.css'

type Props = {
  navigate(path: string): void
  onLogout(): Promise<void>
  personProfile: PersonProfile | null | undefined
  user: AuthUser
}

function Avatar({ initials }: { initials: string | null }) {
  return <span className="user-avatar account-avatar" aria-hidden="true">{initials ?? <svg viewBox="0 0 24 24" width="19" height="19"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>}</span>
}

export function AccountMenu({ navigate, onLogout, personProfile, user }: Props) {
  const [open, setOpen] = useState(false)
  const controlRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const identity = user.email ?? user.phone ?? 'شناسه ورود ثبت نشده'
  const displayName = deriveDisplayName(personProfile)
  const initials = deriveInitials(displayName)

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen((current) => accountMenuState(current, 'escape'))
      triggerRef.current?.focus()
    }
    const closeOutside = (event: PointerEvent) => {
      if (!controlRef.current?.contains(event.target as Node)) setOpen((current) => accountMenuState(current, 'outside'))
    }
    const closeOnHistoryNavigation = () => setOpen(false)
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOutside)
    window.addEventListener('popstate', closeOnHistoryNavigation)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('popstate', closeOnHistoryNavigation)
    }
  }, [open])

  const moveFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
    const currentIndex = items.findIndex((item) => item === document.activeElement)
    const nextIndex = nextAccountMenuItemIndex(currentIndex, items.length, event.key)
    if (nextIndex < 0) return
    event.preventDefault()
    items[nextIndex]?.focus()
  }

  const goTo = (path: string) => {
    setOpen((current) => accountMenuState(current, 'navigate'))
    navigate(path)
  }

  return <div className="account-control" ref={controlRef}>
    <button aria-expanded={open} aria-haspopup="menu" aria-label="بازکردن منوی حساب" className="account-trigger" onClick={() => setOpen((current) => accountMenuState(current, 'toggle'))} ref={triggerRef} type="button">
      <Avatar initials={initials} />
      <span className="account-trigger__copy"><strong>{displayName ?? 'مشاور'}</strong><small dir="ltr">{identity}</small></span>
      <span aria-hidden="true" className="account-trigger__chevron">⌄</span>
    </button>
    {open && <div className="account-menu" onKeyDown={moveFocus} ref={menuRef} role="menu"><button role="menuitem" type="button" onClick={() => goTo('/profile')}>پروفایل من</button><button role="menuitem" type="button" onClick={() => goTo('/profile/settings')}>تنظیمات</button><button role="menuitem" type="button" onClick={() => goTo('/profile/security')}>امنیت و حساب</button><span className="account-menu__divider" /><button className="account-menu__logout" role="menuitem" type="button" onClick={() => { setOpen(false); void onLogout() }}>خروج</button></div>}
  </div>
}
