import { isIP } from 'node:net'
import { z } from 'zod'

const normalizeOrigin = (value: string): string | undefined => {
  try {
    const url = new URL(value)

    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return undefined
    }

    return url.origin
  } catch {
    return undefined
  }
}

export const parseOrigin = (value: string, name = 'origin'): string => {
  const origin = normalizeOrigin(value.trim())

  if (!origin) {
    throw new Error(`${name} must be an HTTP(S) origin without a path, query, or fragment`)
  }

  return origin
}

const originSchema = (name: string) =>
  z.string().transform((value, context) => {
    try {
      return parseOrigin(value, name)
    } catch (error) {
      context.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : `${name} is invalid`,
      })

      return z.NEVER
    }
  })

export const parseCorsOrigins = (value: string): string[] => {
  const entries = value.split(',')

  if (entries.some((entry) => entry.trim() === '')) {
    throw new Error('CORS_ORIGINS must not contain empty entries')
  }

  const origins = entries.map((entry) => parseOrigin(entry, 'CORS_ORIGINS entry'))

  if (origins.includes('*')) {
    throw new Error('CORS_ORIGINS must not contain a wildcard')
  }

  return [...new Set(origins)]
}

export type TrustProxyConfig = false | string[]

const isIpOrCidr = (value: string): boolean => {
  const slashIndex = value.lastIndexOf('/')
  const address = slashIndex === -1 ? value : value.slice(0, slashIndex)
  const version = isIP(address)

  if (version === 0) return false
  if (slashIndex === -1) return true

  const prefix = value.slice(slashIndex + 1)
  if (!/^\d+$/.test(prefix)) return false

  const bits = Number(prefix)
  return bits >= 0 && bits <= (version === 4 ? 32 : 128)
}

export const parseTrustProxy = (value: string | undefined): TrustProxyConfig => {
  const normalized = value?.trim()

  if (!normalized || normalized.toLowerCase() === 'false') return false

  if (normalized.toLowerCase() === 'true' || /^\d+$/.test(normalized)) {
    throw new Error('TRUST_PROXY must be false or an explicit comma-separated IP/CIDR allowlist')
  }

  const entries = normalized.split(',').map((entry) => entry.trim())
  if (entries.some((entry) => !entry || !isIpOrCidr(entry))) {
    throw new Error('TRUST_PROXY contains an invalid IP or CIDR entry')
  }

  return [...new Set(entries)]
}

const cookieDomainSchema = z
  .string()
  .optional()
  .transform((value, context) => {
    const domain = value?.trim()
    if (!domain) return undefined

    const normalized = domain.replace(/^\./, '').toLowerCase()
    const valid =
      normalized.length <= 253 &&
      normalized.split('.').every((label) =>
        /^(?!-)[a-z0-9-]{1,63}(?<!-)$/.test(label),
      )

    if (!valid) {
      context.addIssue({
        code: 'custom',
        message: 'COOKIE_DOMAIN must be a hostname without a scheme, port, or path',
      })

      return z.NEVER
    }

    return normalized
  })

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    PORT: z.coerce
      .number()
      .int()
      .positive()
      .default(4000),

    HOST: z
      .string()
      .default('0.0.0.0'),

    API_URL: originSchema('API_URL'),
    STUDENT_APP_URL: originSchema('STUDENT_APP_URL'),
    COUNSELOR_APP_URL: originSchema('COUNSELOR_APP_URL'),

    CORS_ORIGINS: z.string().transform((value, context) => {
      try {
        return parseCorsOrigins(value)
      } catch (error) {
        context.addIssue({
          code: 'custom',
          message: error instanceof Error ? error.message : 'CORS_ORIGINS is invalid',
        })

        return z.NEVER
      }
    }),

    COOKIE_DOMAIN: cookieDomainSchema,

    TRUST_PROXY: z.string().optional().transform((value, context) => {
      try {
        return parseTrustProxy(value)
      } catch (error) {
        context.addIssue({
          code: 'custom',
          message: error instanceof Error ? error.message : 'TRUST_PROXY is invalid',
        })

        return z.NEVER
      }
    }),

    DATABASE_URL: z.string().min(1),

    ACCESS_TOKEN_SECRET: z.string().min(32),

    ACCESS_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(900),

    REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(2_592_000),

    ACCESS_TOKEN_ISSUER: z.string().min(1).default('konkourx-api'),

    ACCESS_TOKEN_AUDIENCE: z.string().min(1).default('konkourx-client'),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== 'production') return

    for (const key of ['API_URL', 'STUDENT_APP_URL', 'COUNSELOR_APP_URL'] as const) {
      if (!value[key].startsWith('https://')) {
        context.addIssue({
          code: 'custom',
          message: `${key} must use HTTPS in production`,
          path: [key],
        })
      }
    }

    for (const key of ['STUDENT_APP_URL', 'COUNSELOR_APP_URL'] as const) {
      if (!value.CORS_ORIGINS.includes(value[key])) {
        context.addIssue({
          code: 'custom',
          message: `${key} must be included in CORS_ORIGINS in production`,
          path: ['CORS_ORIGINS'],
        })
      }
    }
  })

export const parseEnv = (input: NodeJS.ProcessEnv = process.env) =>
  envSchema.parse(input)
