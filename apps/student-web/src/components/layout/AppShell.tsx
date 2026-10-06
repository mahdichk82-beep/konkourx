import type { AuthUser, PersonProfile } from '../../auth/auth-client'
import type { ReactNode } from 'react'
import { BrandLogo } from '@konkourx/brand'
import type { NavIconName } from '../navigation/NavIcon'
import { NavIcon } from '../navigation/NavIcon'
import { Button } from '../ui/Button'
import type { Theme } from '../../theme/useTheme'
import { AccountMenu } from '../../profile/AccountMenu'

export type NavigationItem = {
  icon: NavIconName
  label: string
  mobileLabel: string
  path: string
}

type AppShellProps = {
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

const identityFor = (user: AuthUser) => user.email ?? user.phone ?? 'دانش‌آموز'

export function AppShell({
  children,
  currentPath,
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

  return (
    <div className="app-shell" dir="rtl">
      <aside className="sidebar">
        <BrandLogo descriptor="فضای دانش‌آموز" />
        <nav className="sidebar-nav" aria-label="ناوبری اصلی دانش‌آموز">
          {navigation.map((item) => (
            <a
              className={currentPath === item.path ? 'nav-link nav-link--active' : 'nav-link'}
              href={item.path}
              key={item.path}
              onClick={(event) => { event.preventDefault(); navigate(item.path) }}
              aria-current={currentPath === item.path ? 'page' : undefined}
            >
              <NavIcon name={item.icon} /><span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-summary">
            <span className="user-avatar" aria-hidden="true">د</span>
            <div><strong>دانش‌آموز</strong><small title={identity}>{identity}</small></div>
          </div>
          <Button variant="ghost" onClick={() => void onLogout()}>خروج امن</Button>
        </div>
      </aside>

      <div className="app-workspace">
        <header className="app-header">
          <div>
            <p className="page-kicker">پنل دانش‌آموز</p>
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>
          <div className="header-actions">
            <Button
              aria-label={theme === 'light' ? 'فعال‌کردن حالت تاریک' : 'فعال‌کردن حالت روشن'}
              onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
              variant="secondary"
            >
              <span aria-hidden="true">{theme === 'light' ? '◐' : '☀'}</span>
              <span className="theme-label">{theme === 'light' ? 'تاریک' : 'روشن'}</span>
            </Button>
            <AccountMenu navigate={navigate} onLogout={onLogout} personProfile={personProfile} user={user} />
          </div>
        </header>
        <main className="app-content" id="main-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="ناوبری موبایل دانش‌آموز">
        {navigation.map((item) => (
          <a
            className={currentPath === item.path ? 'mobile-nav__link mobile-nav__link--active' : 'mobile-nav__link'}
            href={item.path}
            key={item.path}
            onClick={(event) => { event.preventDefault(); navigate(item.path) }}
            aria-current={currentPath === item.path ? 'page' : undefined}
          >
            <NavIcon name={item.icon} /><span>{item.mobileLabel}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
