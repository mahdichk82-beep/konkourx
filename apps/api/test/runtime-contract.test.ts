import assert from 'node:assert/strict'
import test from 'node:test'
import { parseEnv, parseTrustProxy } from '../src/config/runtime.js'

const developmentEnvironment = (): NodeJS.ProcessEnv => ({
  ACCESS_TOKEN_SECRET: 'test-secret-that-is-at-least-32-characters',
  API_URL: 'http://localhost:4000/',
  CORS_ORIGINS: ' http://localhost:5173 , http://localhost:5174 ',
  COUNSELOR_APP_URL: 'http://localhost:5174',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/konkourx_test',
  NODE_ENV: 'development',
  STUDENT_APP_URL: 'http://localhost:5173',
  TRUST_PROXY: 'false',
})

test('runtime environment normalizes origins and defaults to host-only cookies', () => {
  const environment = parseEnv(developmentEnvironment())

  assert.equal(environment.API_URL, 'http://localhost:4000')
  assert.deepEqual(environment.CORS_ORIGINS, [
    'http://localhost:5173',
    'http://localhost:5174',
  ])
  assert.equal(environment.COOKIE_DOMAIN, undefined)
  assert.equal(environment.TRUST_PROXY, false)
})

test('runtime environment rejects malformed origins and empty CORS entries', () => {
  assert.throws(
    () => parseEnv({ ...developmentEnvironment(), API_URL: 'http://localhost:4000/api/v1' }),
    /API_URL must be an HTTP\(S\) origin/,
  )
  assert.throws(
    () => parseEnv({ ...developmentEnvironment(), CORS_ORIGINS: 'http://localhost:5173,' }),
    /must not contain empty entries/,
  )
  assert.throws(
    () => parseEnv({ ...developmentEnvironment(), CORS_ORIGINS: '*' }),
    /CORS_ORIGINS entry must be an HTTP\(S\) origin/,
  )
})

test('production requires HTTPS and both application origins in CORS', () => {
  assert.throws(
    () => parseEnv({ ...developmentEnvironment(), NODE_ENV: 'production' }),
    /must use HTTPS in production/,
  )

  const production = parseEnv({
    ...developmentEnvironment(),
    API_URL: 'https://api.konkourix.ir',
    CORS_ORIGINS: 'https://app.konkourix.ir,https://counselor.konkourix.ir',
    COUNSELOR_APP_URL: 'https://counselor.konkourix.ir',
    NODE_ENV: 'production',
    STUDENT_APP_URL: 'https://app.konkourix.ir',
  })

  assert.equal(production.API_URL, 'https://api.konkourix.ir')

  assert.throws(
    () => parseEnv({
      ...developmentEnvironment(),
      API_URL: 'https://api.konkourix.ir',
      CORS_ORIGINS: 'https://app.konkourix.ir',
      COUNSELOR_APP_URL: 'https://counselor.konkourix.ir',
      NODE_ENV: 'production',
      STUDENT_APP_URL: 'https://app.konkourix.ir',
    }),
    /COUNSELOR_APP_URL must be included in CORS_ORIGINS/,
  )
})

test('trusted proxy parsing accepts explicit IP/CIDR entries only', () => {
  assert.deepEqual(
    parseTrustProxy('127.0.0.1, 10.0.0.0/8, ::1'),
    ['127.0.0.1', '10.0.0.0/8', '::1'],
  )
  assert.equal(parseTrustProxy(''), false)
  assert.throws(() => parseTrustProxy('true'), /explicit comma-separated IP\/CIDR/)
  assert.throws(() => parseTrustProxy('1'), /explicit comma-separated IP\/CIDR/)
  assert.throws(() => parseTrustProxy('proxy.internal'), /invalid IP or CIDR/)
})
