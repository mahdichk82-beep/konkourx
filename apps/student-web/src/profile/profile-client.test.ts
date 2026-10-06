import assert from 'node:assert/strict'
import test from 'node:test'

import { createStudentProfileClient } from './profile-client.ts'

test('Student profile client loads and updates private PersonProfile fields', async () => {
  const calls: Array<{ body?: string; method?: string; path: string }> = []
  const client = createStudentProfileClient(async <T>(path: string, init: RequestInit = {}) => {
    calls.push({ body: init.body?.toString(), method: init.method, path })
    return null as T
  })

  await client.getPersonProfile()
  await client.updatePersonProfile({
    firstName: 'سارا',
    lastName: 'احمدی',
    preferredName: null,
    province: 'تهران',
    city: null,
  })

  assert.deepEqual(calls, [
    { body: undefined, method: undefined, path: '/me/person-profile' },
    {
      body: JSON.stringify({ firstName: 'سارا', lastName: 'احمدی', preferredName: null, province: 'تهران', city: null }),
      method: 'PATCH',
      path: '/me/person-profile',
    },
  ])
})

test('Student profile client preserves academic fields and nullable authoritative track', async () => {
  const calls: Array<{ body?: string; method?: string; path: string }> = []
  const client = createStudentProfileClient(async <T>(path: string, init: RequestInit = {}) => {
    calls.push({ body: init.body?.toString(), method: init.method, path })
    return null as T
  })

  await client.getStudentProfile()
  await client.updateStudentProfile({
    educationLevel: 'دوازدهم',
    schoolName: 'دبیرستان نمونه',
    track: 'EXPERIMENTAL',
  })
  await client.updateStudentProfile({ track: null })

  assert.deepEqual(calls, [
    { body: undefined, method: undefined, path: '/me/student-profile' },
    {
      body: JSON.stringify({ educationLevel: 'دوازدهم', schoolName: 'دبیرستان نمونه', track: 'EXPERIMENTAL' }),
      method: 'PATCH',
      path: '/me/student-profile',
    },
    { body: JSON.stringify({ track: null }), method: 'PATCH', path: '/me/student-profile' },
  ])
})
