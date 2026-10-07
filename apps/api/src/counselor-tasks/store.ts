import type {
  AssignedResourceResult,
  AssignedTaskResult,
  AssignedStudentTrackResult,
  AssignedTopicResult,
  CounselorStudentSubject,
  CounselorTaskPageQuery,
  CounselorTaskStoreQuery,
  CounselorTaskPlanningPatch,
  CreateCounselorTaskBatchResult,
  CreateCounselorTaskRecordInput,
  CreateCounselorTaskResult,
  RescheduleCounselorTaskResult,
} from './types.js'
import type { ReplaceCurriculumTargetsResult, ResolvedCurriculumTarget } from '../task-curriculum/types.js'
import type { CurriculumTrackId } from '../curriculum/types.js'

export interface CounselorTaskStore {
  findAssignedStudentTrack(
    counselorUserId: string,
    studentProfileId: string,
  ): Promise<AssignedStudentTrackResult>
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
    expectedTrack?: CurriculumTrackId | null,
  ): Promise<CreateCounselorTaskResult>
  createAssignedStudentTasksBatch(
    counselorUserId: string,
    studentProfileId: string,
    inputs: CreateCounselorTaskRecordInput[],
    curriculumTargetsByTask?: ResolvedCurriculumTarget[][],
    expectedTrack?: CurriculumTrackId | null,
  ): Promise<CreateCounselorTaskBatchResult>
  rescheduleAssignedStudentTask(
    counselorUserId: string,
    studentProfileId: string,
    taskId: string,
    patch: CounselorTaskPlanningPatch,
  ): Promise<RescheduleCounselorTaskResult>
  replaceAssignedTaskCurriculumTargets?(
    counselorUserId: string,
    studentProfileId: string,
    taskId: string,
    targets: ResolvedCurriculumTarget[],
    expectedTrack?: CurriculumTrackId | null,
  ): Promise<ReplaceCurriculumTargetsResult | { ok: false; reason: 'STUDENT_NOT_FOUND' }>
}
