import { apiUrl } from '../config/api.ts'
import { createStudentProfileClient } from '../profile/profile-client.ts'

export type AuthRole = 'STUDENT' | 'COUNSELOR' | 'ADMIN'

export type AuthUser = {
  id: string
  email: string | null
  phone: string | null
  role: AuthRole
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
  createdAt: string
  updatedAt: string
}

export type PersonProfile = {
  id: string
  userId: string
  firstName: string | null
  lastName: string | null
  preferredName: string | null
  province: string | null
  city: string | null
  createdAt: string
  updatedAt: string
}

export type PersonProfileInput = {
  firstName?: string | null
  lastName?: string | null
  preferredName?: string | null
  province?: string | null
  city?: string | null
}

export type StudentTrack = 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES'

export type StudentProfile = {
  id: string
  userId: string
  track: StudentTrack | null
  educationLevel: string | null
  schoolName: string | null
  createdAt: string
  updatedAt: string
}

export type StudentProfileInput = {
  track?: StudentTrack | null
  educationLevel?: string | null
  schoolName?: string | null
}

type AuthPayload = {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: { code?: string; message?: string }
}

export class AuthApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
    this.code = code
  }
}

const endpoint = (path: string) => `${apiUrl}/api/v1${path}`

const request = async <T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> => {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`)

  const response = await fetch(endpoint(path), {
    ...init,
    credentials: 'include',
    headers,
  })
  const payload = (await response.json()) as ApiEnvelope<T>

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new AuthApiError(
      response.status,
      payload.error?.code ?? 'REQUEST_FAILED',
      payload.error?.message ?? 'Request failed',
    )
  }

  return payload.data
}

class StudentAuthClient {
  private accessToken: string | null = null
  private restorePromise: Promise<AuthUser | null> | null = null

  private async refresh(): Promise<AuthUser> {
    const result = await request<AuthPayload>('/auth/refresh', { method: 'POST' })
    this.accessToken = result.accessToken
    return this.currentSession()
  }

  private async currentSession(): Promise<AuthUser> {
    if (!this.accessToken) {
      throw new AuthApiError(401, 'TOKEN_MISSING', 'Authentication is required')
    }
    return request<AuthUser>(
      '/student/session',
      { method: 'GET' },
      this.accessToken,
    )
  }

  restoreSession(): Promise<AuthUser | null> {
    if (!this.restorePromise) {
      this.restorePromise = (async () => {
        try {
          return this.accessToken ? await this.currentSession() : await this.refresh()
        } catch (error) {
          this.accessToken = null
          if (error instanceof AuthApiError && (error.status === 401 || error.status === 403)) {
            return null
          }
          throw error
        }
      })().finally(() => {
        this.restorePromise = null
      })
    }

    return this.restorePromise
  }

  async login(identifier: string, password: string): Promise<AuthUser> {
    const result = await request<AuthPayload>('/auth/login', {
      body: JSON.stringify({ identifier, password }),
      method: 'POST',
    })
    this.accessToken = result.accessToken

    try {
      return await this.currentSession()
    } catch (error) {
      await this.logout()
      if (error instanceof AuthApiError && error.status === 403) {
        throw new AuthApiError(
          403,
          'WRONG_APPLICATION_ROLE',
          'This account cannot access the student application',
        )
      }
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await request<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' })
    } finally {
      this.accessToken = null
    }
  }

  async logoutAll(): Promise<void> {
    await this.authorizedRequest<{ loggedOut: boolean }>(
      '/auth/logout-all',
      { method: 'POST' },
    )
    this.accessToken = null
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.authorizedRequest<{ passwordChanged: boolean; reauthenticationRequired: boolean }>(
      '/auth/change-password',
      {
        body: JSON.stringify({ currentPassword, newPassword }),
        method: 'POST',
      },
    )
    this.accessToken = null
  }

  getPersonProfile(): Promise<PersonProfile | null> {
    return createStudentProfileClient(this.authorizedRequest.bind(this)).getPersonProfile()
  }

  updatePersonProfile(input: PersonProfileInput): Promise<PersonProfile> {
    return createStudentProfileClient(this.authorizedRequest.bind(this)).updatePersonProfile(input)
  }

  getStudentProfile(): Promise<StudentProfile | null> {
    return createStudentProfileClient(this.authorizedRequest.bind(this)).getStudentProfile()
  }

  updateStudentProfile(input: StudentProfileInput): Promise<StudentProfile> {
    return createStudentProfileClient(this.authorizedRequest.bind(this)).updateStudentProfile(input)
  }

  async authorizedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.accessToken) await this.refresh()

    try {
      return await request<T>(path, init, this.accessToken ?? undefined)
    } catch (error) {
      if (!(error instanceof AuthApiError) || error.status !== 401) throw error
      await this.refresh()
      return request<T>(path, init, this.accessToken ?? undefined)
    }
  }
}

export const authClient = new StudentAuthClient()
