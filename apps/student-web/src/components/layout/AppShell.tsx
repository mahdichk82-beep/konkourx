import type { AuthUser, PersonProfile } from '../../auth/auth-client'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import type { NavIconName } from '../navigation/NavIcon'
import { NavIcon } from '../navigation/NavIcon'
import { Button } from '../ui/Button'
import type { Theme } from '../../theme/useTheme'
import { BrandLogo } from '@konkourx/brand'
import { isNavigationItemActive, mobileNavigationState, nextTheme } from './shell-state'
import { accountMenuState, deriveDisplayName, deriveInitials, nextAccountMenuItemIndex } from '../../profile/profile-state'
import '../../profile/account-menu.css'

export type NavigationItem = {
  icon: NavIconName
  label: string
  mobileLabel: string
  path: string
}

type AppShellProps = {
  headerAccessory?: ReactNode
  children: ReactNode
  currentPath: string
  navigation: NavigationItem[]
  navigate(path: string): void
  onLogout(): Promise<void>
  onThemeChange(theme: Theme): void
  pageDescription: string
  pageTitle: string
  personProfile: PersonProfile | null | undefined
  theme: Theme
  user: AuthUser
}

const identityFor = (user: AuthUser) => user.email ?? user.phone ?? 'شناسه ورود ثبت نشده'

function Avatar({ initials }: { initials: string | null }) {
  return <span className="user-avatar account-avatar" aria-hidden="true">{initials ?? <svg viewBox="0 0 24 24" width="19" height="19"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>}</span>
}

export function AppShell({
  children,
  currentPath,
  headerAccessory,
  navigation,
  navigate,
  onLogout,
  onThemeChange,
  pageDescription,
  pageTitle,
  personProfile,
  theme,
  user,
}: AppShellProps) {
  const identity = identityFor(user)
  const displayName = deriveDisplayName(personProfile)
  const initials = deriveInitials(displayName)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)
  const drawerPanelRef = useRef<HTMLElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const accountTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!mobileNavigationOpen) return
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const manageDrawerKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavigationOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = drawerPanelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', manageDrawerKeyboard)
    drawerCloseRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', manageDrawerKeyboard)
      previouslyFocused?.focus()
    }
  }, [mobileNavigationOpen])

  useEffect(() => {
    if (!accountMenuOpen) return
    accountMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const closeAccountMenu = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen((current) => accountMenuState(current, 'escape'))
        accountTriggerRef.current?.focus()
      }
    }
    const closeOutside = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountMenuOpen((current) => accountMenuState(current, 'outside'))
    }
    const closeOnHistoryNavigation = () => setAccountMenuOpen(false)
    document.addEventListener('keydown', closeAccountMenu)
    document.addEventListener('pointerdown', closeOutside)
    window.addEventListener('popstate', closeOnHistoryNavigation)
    return () => {
      document.removeEventListener('keydown', closeAccountMenu)
      document.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('popstate', closeOnHistoryNavigation)
    }
  }, [accountMenuOpen])

  const moveAccountMenuFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
    const currentIndex = items.findIndex((item) => item === document.activeElement)
    const nextIndex = nextAccountMenuItemIndex(currentIndex, items.length, event.key)
    if (nextIndex < 0) return
    event.preventDefault()
    items[nextIndex]?.focus()
  }

  const goTo = (path: string) => {
    setMobileNavigationOpen((current) => mobileNavigationState(current, 'navigate'))
    setAccountMenuOpen((current) => accountMenuState(current, 'navigate'))
    navigate(path)
  }

  const navigationLinks = () => navigation.map((item) => {
    const active = isNavigationItemActive(currentPath, item.path)
    return (
      <a
        className={active ? 'nav-link nav-link--active' : 'nav-link'}
        href={item.path}
        key={item.path}
        onClick={(event) => { event.preventDefault(); goTo(item.path) }}
        aria-current={active ? 'page' : undefined}
      >
        <span className="nav-link__icon"><NavIcon name={item.icon} /></span>
        <span>{item.label}</span>
      </a>
    )
  })

  return (
    <div className="app-shell app-shell--student" dir="rtl">
      <a className="skip-link" href="#main-content">پرش به محتوای اصلی</a>
      <aside className="sidebar" data-side="right">
        <BrandLogo descriptor="فضای دانش‌آموز" />
        <nav className="sidebar-nav" aria-label="ناوبری اصلی دانش‌آموز">
          <p className="sidebar-nav__label">مسیر دانش‌آموز</p>
          {navigationLinks()}
        </nav>
        <div className="sidebar-footer">
          <div className="user-summary">
            <Avatar initials={initials} />
            <div><strong>{displayName ?? 'دانش‌آموز'}</strong><small title={identity}>{identity}</small></div>
          </div>
          <Button variant="ghost" onClick={() => void onLogout()}>خروج امن</Button>
        </div>
      </aside>

      <div className="app-workspace">
        <header className="app-header">
          <button
            aria-controls="student-mobile-navigation"
            aria-expanded={mobileNavigationOpen}
            aria-label="بازکردن فهرست اصلی"
            className="menu-button"
            onClick={() => setMobileNavigationOpen((current) => mobileNavigationState(current, 'toggle'))}
            type="button"
          >
            <span /><span /><span />
          </button>
          <div className="app-header__title">
            <p className="page-kicker">پنل دانش‌آموز</p>
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>
          <div className="header-actions">
            {headerAccessory}
            <Button
              aria-label={theme === 'light' ? 'فعال‌کردن حالت تاریک' : 'فعال‌کردن حالت روشن'}
              className="theme-toggle account-theme-toggle"
              onClick={() => onThemeChange(nextTheme(theme))}
              variant="ghost"
            >
              <span className="theme-toggle__icon" aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
              <span className="theme-label">{theme === 'light' ? 'تاریک' : 'روشن'}</span>
            </Button>
            <div className="account-control" ref={accountRef}>
              <button aria-expanded={accountMenuOpen} aria-haspopup="menu" aria-label="بازکردن منوی حساب" className="account-trigger" onClick={() => setAccountMenuOpen((current) => accountMenuState(current, 'toggle'))} ref={accountTriggerRef} type="button">
                <Avatar initials={initials} />
                <span className="account-trigger__copy"><strong>{displayName ?? 'دانش‌آموز'}</strong><small dir="ltr">{identity}</small></span>
                <span aria-hidden="true" className="account-trigger__chevron">⌄</span>
              </button>
              {accountMenuOpen && <div className="account-menu" onKeyDown={moveAccountMenuFocus} ref={accountMenuRef} role="menu"><button role="menuitem" type="button" onClick={() => goTo('/profile')}>پروفایل من</button><button role="menuitem" type="button" onClick={() => goTo('/profile/settings')}>تنظیمات</button><button role="menuitem" type="button" onClick={() => goTo('/profile/security')}>امنیت و حساب</button><span className="account-menu__divider" /><button className="account-menu__logout" role="menuitem" type="button" onClick={() => { setAccountMenuOpen(false); void onLogout() }}>خروج</button></div>}
            </div>
          </div>
        </header>
        <main className="app-content" id="main-content">{children}</main>
      </div>

      <div className={mobileNavigationOpen ? 'mobile-drawer mobile-drawer--open' : 'mobile-drawer'} aria-hidden={!mobileNavigationOpen} inert={!mobileNavigationOpen}>
        <button className="mobile-drawer__backdrop" aria-label="بستن فهرست" onClick={() => setMobileNavigationOpen(false)} tabIndex={mobileNavigationOpen ? 0 : -1} type="button" />
        <aside ref={drawerPanelRef} className="mobile-drawer__panel" id="student-mobile-navigation" aria-label="فهرست موبایل دانش‌آموز" aria-modal="true" role="dialog">
          <div className="mobile-drawer__header">
            <BrandLogo descriptor="فضای دانش‌آموز" />
            <button ref={drawerCloseRef} className="drawer-close" aria-label="بستن فهرست" onClick={() => setMobileNavigationOpen(false)} type="button">×</button>
          </div>
          <nav className="sidebar-nav" aria-label="ناوبری موبایل دانش‌آموز">{navigationLinks()}</nav>
          <div className="mobile-drawer__footer"><Button variant="ghost" onClick={() => void onLogout()}>خروج امن</Button></div>
        </aside>
      </div>
    </div>
  )
}
