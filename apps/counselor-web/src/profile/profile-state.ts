import type { PersonProfile } from '../auth/auth-client.ts'

type PersonName = Pick<PersonProfile, 'firstName' | 'lastName' | 'preferredName'>
export type CounselorProfileSection = 'personal' | 'professional' | 'settings' | 'security'
export type AccountMenuAction = 'toggle' | 'escape' | 'outside' | 'navigate'
export type AccountMenuArrowKey = 'ArrowDown' | 'ArrowUp'

const clean = (value: string | null | undefined) => value?.trim() || null

export const deriveDisplayName = (profile: PersonName | null | undefined): string | null => {
  if (!profile) return null
  const preferredName = clean(profile.preferredName)
  if (preferredName) return preferredName
  return [clean(profile.firstName), clean(profile.lastName)].filter(Boolean).join(' ') || null
}

export const deriveInitials = (displayName: string | null): string | null => {
  if (!displayName) return null
  return displayName.split(/\s+/u).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join('') || null
}

export const profileSectionForPath = (path: string): CounselorProfileSection | null => {
  if (path === '/settings' || path === '/profile/settings') return 'settings'
  if (path === '/profile/professional') return 'professional'
  if (path === '/profile/security') return 'security'
  if (path === '/profile') return 'personal'
  return null
}

export const accountMenuState = (current: boolean, action: AccountMenuAction) =>
  action === 'toggle' ? !current : false

export const nextAccountMenuItemIndex = (currentIndex: number, itemCount: number, key: AccountMenuArrowKey) => {
  if (itemCount <= 0) return -1
  if (currentIndex < 0) return key === 'ArrowDown' ? 0 : itemCount - 1
  const offset = key === 'ArrowDown' ? 1 : -1
  return (currentIndex + offset + itemCount) % itemCount
}

export const shouldLoadProfileSection = (
  activeSection: CounselorProfileSection | null,
  requestedSection: CounselorProfileSection,
  hasResolvedValue: boolean,
  requestInFlight: boolean,
) => activeSection === requestedSection && !hasResolvedValue && !requestInFlight
