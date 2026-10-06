import type { PersonProfile, PersonProfileInput, StudentProfile, StudentProfileInput } from '../auth/auth-client.ts'

type AuthorizedRequest = <T>(path: string, init?: RequestInit) => Promise<T>

export const createStudentProfileClient = (authorizedRequest: AuthorizedRequest) => ({
  getPersonProfile: () => authorizedRequest<PersonProfile | null>('/me/person-profile'),
  updatePersonProfile: (input: PersonProfileInput) => authorizedRequest<PersonProfile>('/me/person-profile', {
    body: JSON.stringify(input), method: 'PATCH',
  }),
  getStudentProfile: () => authorizedRequest<StudentProfile | null>('/me/student-profile'),
  updateStudentProfile: (input: StudentProfileInput) => authorizedRequest<StudentProfile>('/me/student-profile', {
    body: JSON.stringify(input), method: 'PATCH',
  }),
})
