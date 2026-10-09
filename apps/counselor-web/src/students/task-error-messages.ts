const messages: Record<string, string> = {
  STUDENT_TRACK_NOT_SET: 'برای انتخاب مباحث، ابتدا رشته دانش‌آموز مشخص شود.',
  CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK: 'مبحث انتخاب‌شده برای رشته این دانش‌آموز مجاز نیست.',
  CURRICULUM_TARGET_NOT_SELECTABLE: 'مورد انتخاب‌شده مبحث قابل انتخاب نیست.',
  CURRICULUM_SELECTOR_LIMIT_EXCEEDED: 'تعداد انتخاب‌ها بیشتر از حد مجاز است. چند انتخاب را حذف کنید.',
  CURRICULUM_SELECTION_EMPTY: 'برای کار درسی حداقل یک مبحث معتبر انتخاب کنید.',
  TASK_STUDY_TARGET_REQUIRED: 'برای کار درسی حداقل یک مبحث لازم است.',
  TASK_GENERAL_TARGET_FORBIDDEN: 'کار عمومی نباید مبحث درسی داشته باشد.',
  TASK_LEGACY_LINK_FORBIDDEN: 'پیوند درس یا مبحث قدیمی برای این نوع کار مجاز نیست.',
  TASK_SCHEDULE_INVALID: 'بازه زمانی باید در همان روز، با فاصله‌های ۱۵ دقیقه‌ای و ساعت پایان بعد از شروع باشد.',
}

export const taskContentErrorMessage = (code: string): string | null => messages[code] ?? null
