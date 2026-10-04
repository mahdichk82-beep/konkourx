type StudentDisplayIdentity = {
  displayName: string | null;
};

export function studentDisplayLabel(student: StudentDisplayIdentity): string {
  return student.displayName?.trim() || 'دانش‌آموز بدون نام';
}
