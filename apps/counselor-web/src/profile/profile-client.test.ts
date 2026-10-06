import assert from 'node:assert/strict'
import test from 'node:test'

import { createCounselorProfileClient } from './profile-client.ts'

test('Counselor profile client loads and updates PersonProfile and private professional fields', async () => {
  const calls: Array<{ body?: string; method?: string; path: string }> = []
  const client = createCounselorProfileClient(async <T>(path: string, init: RequestInit = {}) => {
    calls.push({ body: init.body?.toString(), method: init.method, path })
    return null as T
  })

  await client.getPersonProfile()
  await client.updatePersonProfile({ firstName: 'مریم', lastName: null, preferredName: null, province: null, city: null })
  await client.getCounselorProfile()
  await client.updateCounselorProfile({ specialization: 'برنامه‌ریزی', bio: 'مشاور تحصیلی' })

  assert.deepEqual(calls, [
    { body: undefined, method: undefined, path: '/me/person-profile' },
    {
      body: JSON.stringify({ firstName: 'مریم', lastName: null, preferredName: null, province: null, city: null }),
      method: 'PATCH',
      path: '/me/person-profile',
    },
    { body: undefined, method: undefined, path: '/me/counselor-profile' },
    {
      body: JSON.stringify({ specialization: 'برنامه‌ریزی', bio: 'مشاور تحصیلی' }),
      method: 'PATCH',
      path: '/me/counselor-profile',
    },
  ])
})
