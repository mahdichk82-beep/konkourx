import assert from 'node:assert/strict'
import test from 'node:test'

import {
  STUDENT_TRACK_OPTIONS,
  accountMenuState,
  deriveDisplayName,
  deriveInitials,
  nextAccountMenuItemIndex,
  profileSectionForPath,
  shouldLoadProfileSection,
} from './profile-state.ts'

test('canonical name precedence is preferred, full name, single name, then no human name', () => {
  assert.equal(deriveDisplayName({ preferredName: 'سارا', firstName: 'زهرا', lastName: 'احمدی' }), 'سارا')
  assert.equal(deriveDisplayName({ preferredName: ' ', firstName: 'زهرا', lastName: 'احمدی' }), 'زهرا احمدی')
  assert.equal(deriveDisplayName({ preferredName: null, firstName: null, lastName: 'احمدی' }), 'احمدی')
  assert.equal(deriveDisplayName(null), null)
})

test('avatar uses safe name initials and otherwise requests a neutral fallback', () => {
  assert.equal(deriveInitials('زهرا احمدی'), 'زا')
  assert.equal(deriveInitials('سارا'), 'س')
  assert.equal(deriveInitials(null), null)
})

test('Student tracks have only Persian user-facing labels', () => {
  assert.deepEqual(STUDENT_TRACK_OPTIONS, [
    { label: 'تجربی', value: 'EXPERIMENTAL' },
    { label: 'ریاضی', value: 'MATHEMATICS' },
    { label: 'انسانی', value: 'HUMANITIES' },
  ])
})

test('profile navigation and account-menu state are deterministic', () => {
  assert.equal(profileSectionForPath('/profile'), 'personal')
  assert.equal(profileSectionForPath('/profile/academic'), 'academic')
  assert.equal(profileSectionForPath('/profile/settings'), 'settings')
  assert.equal(profileSectionForPath('/settings'), 'settings')
  assert.equal(profileSectionForPath('/profile/foo'), null)
  assert.equal(profileSectionForPath('/profile/security/unknown'), null)
  assert.equal(accountMenuState(false, 'toggle'), true)
  assert.equal(accountMenuState(true, 'escape'), false)
  assert.equal(accountMenuState(true, 'outside'), false)
  assert.equal(accountMenuState(true, 'navigate'), false)
})

test('account menu arrow navigation wraps through every menu item', () => {
  assert.equal(nextAccountMenuItemIndex(-1, 4, 'ArrowDown'), 0)
  assert.equal(nextAccountMenuItemIndex(-1, 4, 'ArrowUp'), 3)
  assert.equal(nextAccountMenuItemIndex(0, 4, 'ArrowDown'), 1)
  assert.equal(nextAccountMenuItemIndex(3, 4, 'ArrowDown'), 0)
  assert.equal(nextAccountMenuItemIndex(0, 4, 'ArrowUp'), 3)
  assert.equal(nextAccountMenuItemIndex(2, 4, 'ArrowUp'), 1)
})

test('academic data loads only on its unresolved section and stays cached after success', () => {
  assert.equal(shouldLoadProfileSection('personal', 'academic', false, false), false)
  assert.equal(shouldLoadProfileSection('academic', 'academic', false, false), true)
  assert.equal(shouldLoadProfileSection('academic', 'academic', false, true), false)
  assert.equal(shouldLoadProfileSection('academic', 'academic', true, false), false)
})
