import type {
  DailyTaskRecord,
  DailyTaskStatus,
  PageQuery,
  StudyPlanRecord,
  StudyPlanStatus,
  StudySubjectRecord,
  StudentProfileRef,
  TopicRecord,
  RescheduleStudentTaskResult,
  TaskSchedulePatch,
  UpdateTerminalStudentTaskResult,
} from './types.js'
import type {
  ReplaceCurriculumTargetsResult,
  ResolvedCurriculumTarget,
  ToggleCurriculumItemResult,
} from '../task-curriculum/types.js'

export interface StudentCoreStore {
  findStudentProfileByUserId(userId: string): Promise<StudentProfileRef | null>
  listSubjects(profileId: string, query?: PageQuery): Promise<StudySubjectRecord[]>
  findSubjectById(profileId: string, id: string): Promise<StudySubjectRecord | null>
  createSubject(input: { studentProfileId: string; name: string; normalizedName: string }): Promise<StudySubjectRecord>
  updateSubject(profileId: string, id: string, input: { name?: string; normalizedName?: string; archivedAt?: Date | null }): Promise<StudySubjectRecord | null>
  listTopics(profileId: string, subjectId: string, query?: PageQuery): Promise<TopicRecord[]>
  findTopicById(profileId: string, id: string): Promise<TopicRecord | null>
  createTopic(input: { subjectId: string; title: string; normalizedTitle: string }): Promise<TopicRecord>
  updateTopic(profileId: string, id: string, input: { title?: string; normalizedTitle?: string; archivedAt?: Date | null }): Promise<TopicRecord | null>
  listPlans(profileId: string, query?: PageQuery & { status?: StudyPlanStatus }): Promise<StudyPlanRecord[]>
  findPlanById(profileId: string, id: string): Promise<StudyPlanRecord | null>
  createPlan(input: Omit<StudyPlanRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudyPlanRecord>
  updatePlan(profileId: string, id: string, input: Partial<Pick<StudyPlanRecord, 'title' | 'description' | 'status' | 'startsOn' | 'endsOn'>>): Promise<StudyPlanRecord | null>
  listTasks(profileId: string, query?: PageQuery & { scheduledFor?: Date; scheduledFrom?: Date; scheduledTo?: Date; status?: DailyTaskStatus; studyPlanId?: string; subjectId?: string }): Promise<DailyTaskRecord[]>
  findTaskById(profileId: string, id: string): Promise<DailyTaskRecord | null>
  createTask(input: Omit<DailyTaskRecord, 'id' | 'createdAt' | 'updatedAt' | 'curriculumTargets'>, curriculumTargets?: ResolvedCurriculumTarget[]): Promise<DailyTaskRecord>
  updateTask(profileId: string, id: string, input: Partial<Pick<DailyTaskRecord, 'studyPlanId' | 'subjectId' | 'topicId' | 'title' | 'description' | 'estimatedMinutes' | 'status' | 'completedAt' | 'partialAt' | 'skipReason' | 'skippedAt'>>): Promise<DailyTaskRecord | null>
  updateTerminalTask(profileId: string, id: string, input: Partial<Pick<DailyTaskRecord, 'studyPlanId' | 'subjectId' | 'topicId' | 'title' | 'description' | 'estimatedMinutes' | 'status' | 'completedAt' | 'partialAt' | 'skipReason' | 'skippedAt'>>): Promise<UpdateTerminalStudentTaskResult>
  replacePersonalTaskCurriculumTargets?(profileId: string, id: string, targets: ResolvedCurriculumTarget[]): Promise<ReplaceCurriculumTargetsResult>
  toggleTaskCurriculumItem?(profileId: string, taskId: string, itemId: string, completedAt: Date | null): Promise<ToggleCurriculumItemResult>
  reschedulePersonalTask(profileId: string, id: string, schedule: TaskSchedulePatch): Promise<RescheduleStudentTaskResult>
}
