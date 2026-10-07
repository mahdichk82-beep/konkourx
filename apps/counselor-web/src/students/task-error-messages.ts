const messages: Record<string, string> = {
  STUDENT_TRACK_NOT_SET: 'برای انتخاب مباحث، ابتدا رشته دانش‌آموز مشخص شود.',
  CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK: 'مبحث انتخاب‌شده برای رشته این دانش‌آموز مجاز نیست.',
  CURRICULUM_TARGET_NOT_SELECTABLE: 'مورد انتخاب‌شده مبحث قابل انتخاب نیست.',
  TASK_STUDY_TARGET_REQUIRED: 'برای کار درسی حداقل یک مبحث لازم است.',
  TASK_GENERAL_TARGET_FORBIDDEN: 'کار عمومی نباید مبحث درسی داشته باشد.',
  TASK_LEGACY_LINK_FORBIDDEN: 'پیوند درس یا مبحث قدیمی برای این نوع کار مجاز نیست.',
}

export const taskContentErrorMessage = (code: string): string | null => messages[code] ?? null
