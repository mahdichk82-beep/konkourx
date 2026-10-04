import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from '../src/app.js'
import type { AuthService } from '../src/auth/auth-service.js'
import type { PublicUser } from '../src/auth/types.js'

const user: PublicUser = {
  id: 'user-123',
  email: 'student@example.com',
  phone: null,
  role: 'STUDENT',
  status: 'ACTIVE',
  createdAt: new Date('2026-09-03T00:00:00.000Z'),
  updatedAt: new Date('2026-09-03T00:00:00.000Z'),
}

const authResult = {
  accessToken: 'access-token',
  expiresIn: 900,
  refreshToken: 'refresh-token',
  user,
}

let registrationInput: unknown

const createAuthService = (): AuthService => ({
  authenticateAccessToken: async () => user,
  changePassword: async () => undefined,
  getCurrentUser: async () => user,
  login: async () => authResult,
  logout: async () => undefined,
  logoutAll: async () => undefined,
  refresh: async () => authResult,
  register: async (input) => {
    registrationInput = input
    return authResult
  },
})

const createApp = (options: { cookieDomain?: string; cookieSecure?: boolean } = {}) =>
  buildApp({
    auth: createAuthService(),
    cookieDomain: options.cookieDomain,
    cookieSecure: options.cookieSecure,
    environment: 'test',
    logger: false,
    prisma: { $queryRaw: async () => [{ '?column?': 1 }] },
  })

test('registration returns an access token and HttpOnly refresh cookie', async () => {
  const app = createApp()
  const response = await app.inject({
    method: 'POST',
    payload: {
      email: 'student@example.com',
      password: 'strong password',
    },
    url: '/api/v1/auth/register',
  })
  const body = response.json()

  assert.equal(response.statusCode, 201)
  assert.equal(body.success, true)
  assert.equal(body.data.accessToken, 'access-token')
  assert.deepEqual(body.data.user, {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  })
  assert.match(response.headers['set-cookie'], /refresh_token=refresh-token/)
  assert.match(response.headers['set-cookie'], /HttpOnly/)
  assert.match(response.headers['set-cookie'], /Path=\/api\/v1\/auth/)
  assert.match(response.headers['set-cookie'], /SameSite=Lax/)
  assert.doesNotMatch(response.headers['set-cookie'], /Domain=/)
  assert.doesNotMatch(response.headers['set-cookie'], /Secure/)

  await app.close()
})

test('registration accepts canonical track and rejects invalid track', async () => {
  registrationInput = undefined
  const app = createApp()

  const valid = await app.inject({
    method: 'POST',
    payload: {
      email: 'student@example.com',
      password: 'strong password',
      track: 'MATHEMATICS',
    },
    url: '/api/v1/auth/register',
  })

  assert.equal(valid.statusCode, 201)
  assert.deepEqual(registrationInput, {
    email: 'student@example.com',
    password: 'strong password',
    phone: null,
    track: 'MATHEMATICS',
  })

  registrationInput = undefined
  const invalid = await app.inject({
    method: 'POST',
    payload: {
      email: 'student@example.com',
      password: 'strong password',
      track: 'SCIENCE',
    },
    url: '/api/v1/auth/register',
  })

  assert.equal(invalid.statusCode, 400)
  assert.equal(invalid.json().error.code, 'VALIDATION_ERROR')
  assert.equal(registrationInput, undefined)

  await app.close()
})

test('login returns a standard response contract', async () => {
  const app = createApp()
  const response = await app.inject({
    method: 'POST',
    payload: {
      identifier: 'student@example.com',
      password: 'strong password',
    },
    url: '/api/v1/auth/login',
  })
  const body = response.json()

  assert.equal(response.statusCode, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.expiresIn, 900)
  assert.equal(typeof body.requestId, 'string')

  await app.close()
})

test('refresh reads the HttpOnly cookie and rotates the session cookie', async () => {
  const app = createApp()
  const response = await app.inject({
    headers: { cookie: 'refresh_token=old-refresh-token' },
    method: 'POST',
    url: '/api/v1/auth/refresh',
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data.accessToken, 'access-token')
  assert.match(response.headers['set-cookie'], /refresh_token=refresh-token/)

  await app.close()
})

test('logout clears the refresh cookie', async () => {
  const app = createApp()
  const response = await app.inject({
    headers: { cookie: 'refresh_token=refresh-token' },
    method: 'POST',
    url: '/api/v1/auth/logout',
  })

  assert.equal(response.statusCode, 200)
  assert.match(response.headers['set-cookie'], /refresh_token=;/)
  assert.match(response.headers['set-cookie'], /Path=\/api\/v1\/auth/)
  assert.match(response.headers['set-cookie'], /SameSite=Lax/)

  await app.close()
})

test('production refresh cookie is Secure, HttpOnly, and host-only by default', async () => {
  const app = createApp({ cookieSecure: true })
  const response = await app.inject({
    method: 'POST',
    payload: {
      identifier: 'student@example.com',
      password: 'strong password',
    },
    url: '/api/v1/auth/login',
  })

  assert.match(response.headers['set-cookie'], /HttpOnly/)
  assert.match(response.headers['set-cookie'], /Secure/)
  assert.doesNotMatch(response.headers['set-cookie'], /Domain=/)

  await app.close()
})

test('configured cookie domain is applied consistently when setting and clearing', async () => {
  const app = createApp({ cookieDomain: 'api.konkourix.ir', cookieSecure: true })
  const login = await app.inject({
    method: 'POST',
    payload: {
      identifier: 'student@example.com',
      password: 'strong password',
    },
    url: '/api/v1/auth/login',
  })
  const logout = await app.inject({
    headers: { cookie: 'refresh_token=refresh-token' },
    method: 'POST',
    url: '/api/v1/auth/logout',
  })

  for (const header of [login.headers['set-cookie'], logout.headers['set-cookie']]) {
    assert.match(header, /Domain=api\.konkourix\.ir/)
    assert.match(header, /Path=\/api\/v1\/auth/)
    assert.match(header, /HttpOnly/)
    assert.match(header, /Secure/)
    assert.match(header, /SameSite=Lax/)
  }

  await app.close()
})

test('current-user endpoint requires a bearer token and returns a sanitized user', async () => {
  const app = createApp()

  const unauthorized = await app.inject({ method: 'GET', url: '/api/v1/auth/me' })
  assert.equal(unauthorized.statusCode, 401)

  const authorized = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/auth/me',
  })

  assert.equal(authorized.statusCode, 200)
  assert.deepEqual(authorized.json().data, {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  })

  await app.close()
})

test('password change is authenticated and clears the current refresh cookie', async () => {
  const app = createApp()
  const unauthorized = await app.inject({
    method: 'POST',
    payload: { currentPassword: 'strong password', newPassword: 'new strong password' },
    url: '/api/v1/auth/change-password',
  })
  assert.equal(unauthorized.statusCode, 401)

  const authorized = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: { currentPassword: 'strong password', newPassword: 'new strong password' },
    url: '/api/v1/auth/change-password',
  })
  assert.equal(authorized.statusCode, 200)
  assert.equal(authorized.json().data.reauthenticationRequired, true)
  assert.match(authorized.headers['set-cookie'], /refresh_token=;/)

  await app.close()
})

test('logout-all is authenticated and clears the current refresh cookie', async () => {
  const app = createApp()
  const unauthorized = await app.inject({ method: 'POST', url: '/api/v1/auth/logout-all' })
  assert.equal(unauthorized.statusCode, 401)

  const authorized = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    url: '/api/v1/auth/logout-all',
  })
  assert.equal(authorized.statusCode, 200)
  assert.equal(authorized.json().data.loggedOut, true)
  assert.match(authorized.headers['set-cookie'], /refresh_token=;/)

  await app.close()
})
