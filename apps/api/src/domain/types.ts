export type DomainRole = 'STUDENT' | 'COUNSELOR' | 'ADMIN'
export type DomainStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
export type StudentCounselorStatus = 'ACTIVE' | 'INACTIVE'
export type StudentTrack = 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES'

export type DomainUser = {
  id: string
  role: DomainRole
  status: DomainStatus
}

export type StudentProfileRecord = {
  id: string
  userId: string
  track: StudentTrack | null
  educationLevel: string | null
  schoolName: string | null
  createdAt: Date
  updatedAt: Date
}

export type CounselorProfileRecord = {
  id: string
  userId: string
  bio: string | null
  specialization: string | null
  createdAt: Date
  updatedAt: Date
}

export type StudentCounselorRecord = {
  id: string
  studentId: string
  counselorId: string
  status: StudentCounselorStatus
  startedAt: Date
  endedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type StudentProfileInput = {
  track?: StudentTrack | null
  educationLevel?: string | null
  schoolName?: string | null
}

export type CounselorProfileInput = {
  bio?: string | null
  specialization?: string | null
}

export type CounselorStudentRecord = {
  id: string
  displayName: string | null
  educationLevel: string | null
  schoolName: string | null
  status: DomainStatus
}

export type AssignedStudentTrackRecord = {
  track: StudentTrack | null
}

export type CounselorStudentPageQuery = {
  cursor?: string
  limit?: number
}

export type CounselorStudentPage = {
  items: CounselorStudentRecord[]
  nextCursor: string | null
}
