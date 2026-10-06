import assert from 'node:assert/strict'
import test from 'node:test'

import {
  accountMenuState,
  deriveDisplayName,
  deriveInitials,
  nextAccountMenuItemIndex,
  profileSectionForPath,
  shouldLoadProfileSection,
} from './profile-state.ts'

test('Counselor human identity follows canonical name precedence without UUID fallback', () => {
  assert.equal(deriveDisplayName({ preferredName: 'مریم', firstName: 'زهرا', lastName: 'کریمی' }), 'مریم')
  assert.equal(deriveDisplayName({ preferredName: null, firstName: 'زهرا', lastName: 'کریمی' }), 'زهرا کریمی')
  assert.equal(deriveDisplayName(null), null)
  assert.equal(deriveInitials(null), null)
})

test('Counselor profile navigation and account menu close behavior are deterministic', () => {
  assert.equal(profileSectionForPath('/profile'), 'personal')
  assert.equal(profileSectionForPath('/profile/professional'), 'professional')
  assert.equal(profileSectionForPath('/profile/settings'), 'settings')
  assert.equal(profileSectionForPath('/settings'), 'settings')
  assert.equal(profileSectionForPath('/profile/foo'), null)
  assert.equal(profileSectionForPath('/profile/security/unknown'), null)
  assert.equal(accountMenuState(false, 'toggle'), true)
  assert.equal(accountMenuState(true, 'escape'), false)
  assert.equal(accountMenuState(true, 'outside'), false)
  assert.equal(accountMenuState(true, 'navigate'), false)
})

test('Counselor account menu arrow navigation wraps through every menu item', () => {
  assert.equal(nextAccountMenuItemIndex(-1, 4, 'ArrowDown'), 0)
  assert.equal(nextAccountMenuItemIndex(-1, 4, 'ArrowUp'), 3)
  assert.equal(nextAccountMenuItemIndex(0, 4, 'ArrowDown'), 1)
  assert.equal(nextAccountMenuItemIndex(3, 4, 'ArrowDown'), 0)
  assert.equal(nextAccountMenuItemIndex(0, 4, 'ArrowUp'), 3)
  assert.equal(nextAccountMenuItemIndex(2, 4, 'ArrowUp'), 1)
})

test('professional data loads only on its unresolved section and stays cached after success', () => {
  assert.equal(shouldLoadProfileSection('personal', 'professional', false, false), false)
  assert.equal(shouldLoadProfileSection('professional', 'professional', false, false), true)
  assert.equal(shouldLoadProfileSection('professional', 'professional', false, true), false)
  assert.equal(shouldLoadProfileSection('professional', 'professional', true, false), false)
})
