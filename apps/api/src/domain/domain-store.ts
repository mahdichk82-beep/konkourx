import type {
  AssignedStudentTrackRecord,
  CounselorProfileInput,
  CounselorProfileRecord,
  CounselorStudentPage,
  CounselorStudentPageQuery,
  CounselorStudentRecord,
  DomainUser,
  PersonProfileInput,
  PersonProfileRecord,
  StudentCounselorRecord,
  StudentProfileInput,
  StudentProfileRecord,
  StudentCounselorStatus,
} from './types.js'

export interface DomainStore {
  findUserById(id: string): Promise<DomainUser | null>
  findPersonProfile(userId: string): Promise<PersonProfileRecord | null>
  upsertPersonProfile(
    userId: string,
    input: PersonProfileInput,
  ): Promise<PersonProfileRecord>
  findStudentProfile(userId: string): Promise<StudentProfileRecord | null>
  upsertStudentProfile(
    userId: string,
    input: StudentProfileInput,
  ): Promise<StudentProfileRecord>
  findCounselorProfile(userId: string): Promise<CounselorProfileRecord | null>
  upsertCounselorProfile(
    userId: string,
    input: CounselorProfileInput,
  ): Promise<CounselorProfileRecord>
  listStudentRelationships(studentId: string): Promise<StudentCounselorRecord[]>
  listCounselorRelationships(counselorId: string): Promise<StudentCounselorRecord[]>
  createRelationship(input: {
    studentId: string
    counselorId: string
  }): Promise<StudentCounselorRecord>
  updateRelationship(
    id: string,
    status: StudentCounselorStatus,
  ): Promise<StudentCounselorRecord | null>
  listAssignedStudents(
    counselorId: string,
    query: CounselorStudentPageQuery,
  ): Promise<CounselorStudentPage>
  findAssignedStudent(
    counselorId: string,
    studentProfileId: string,
  ): Promise<CounselorStudentRecord | null>
  findAssignedStudentTrack(
    counselorId: string,
    studentProfileId: string,
  ): Promise<AssignedStudentTrackRecord | null>
}
