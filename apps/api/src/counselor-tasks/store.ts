import type {
  AssignedResourceResult,
  AssignedTaskResult,
  AssignedTopicResult,
  CounselorStudentSubject,
  CounselorTaskPageQuery,
  CounselorTaskStoreQuery,
  CreateCounselorTaskBatchResult,
  CreateCounselorTaskRecordInput,
  CreateCounselorTaskResult,
  RescheduleCounselorTaskResult,
} from './types.js'
import type { ReplaceCurriculumTargetsResult, ResolvedCurriculumTarget } from '../task-curriculum/types.js'

export interface CounselorTaskStore {
  listAssignedStudentTasks(
    counselorUserId: string,
    studentProfileId: string,
    query: CounselorTaskStoreQuery,
  ): Promise<AssignedTaskResult>
  listAssignedStudentSubjects(
    counselorUserId: string,
    studentProfileId: string,
    query: CounselorTaskPageQuery,
  ): Promise<AssignedResourceResult<CounselorStudentSubject[]>>
  listAssignedStudentTopics(
    counselorUserId: string,
    studentProfileId: string,
    subjectId: string,
    query: CounselorTaskPageQuery,
  ): Promise<AssignedTopicResult>
  createAssignedStudentTask(
    counselorUserId: string,
    studentProfileId: string,
    input: CreateCounselorTaskRecordInput,
    curriculumTargets?: ResolvedCurriculumTarget[],
  ): Promise<CreateCounselorTaskResult>
  createAssignedStudentTasksBatch(
    counselorUserId: string,
    studentProfileId: string,
    inputs: CreateCounselorTaskRecordInput[],
    curriculumTargetsByTask?: ResolvedCurriculumTarget[][],
  ): Promise<CreateCounselorTaskBatchResult>
  rescheduleAssignedStudentTask(
    counselorUserId: string,
    studentProfileId: string,
    taskId: string,
    scheduledFor: Date,
  ): Promise<RescheduleCounselorTaskResult>
  replaceAssignedTaskCurriculumTargets?(
    counselorUserId: string,
    studentProfileId: string,
    taskId: string,
    targets: ResolvedCurriculumTarget[],
  ): Promise<ReplaceCurriculumTargetsResult | { ok: false; reason: 'STUDENT_NOT_FOUND' }>
}
