import type { CounselorProfile, CounselorProfileInput, PersonProfile, PersonProfileInput } from '../auth/auth-client.ts'

type AuthorizedRequest = <T>(path: string, init?: RequestInit) => Promise<T>

export const createCounselorProfileClient = (authorizedRequest: AuthorizedRequest) => ({
  getPersonProfile: () => authorizedRequest<PersonProfile | null>('/me/person-profile'),
  updatePersonProfile: (input: PersonProfileInput) => authorizedRequest<PersonProfile>('/me/person-profile', {
    body: JSON.stringify(input), method: 'PATCH',
  }),
  getCounselorProfile: () => authorizedRequest<CounselorProfile | null>('/me/counselor-profile'),
  updateCounselorProfile: (input: CounselorProfileInput) => authorizedRequest<CounselorProfile>('/me/counselor-profile', {
    body: JSON.stringify(input), method: 'PATCH',
  }),
})
