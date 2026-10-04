import { CurriculumBrowser } from '@konkourx/curriculum-browser';
import '@konkourx/curriculum-browser/styles.css';
import { useEffect, useMemo, useState } from 'react';

import { AuthApiError, authClient } from '../auth/auth-client';
import { Button } from '../components/ui/Button';
import { ContentState } from '../components/ui/ContentState';
import { studentsClient, type CounselorStudent } from '../students/students-client';
import { createCounselorCurriculumClient } from './curriculum-client';
import { studentDisplayLabel } from './student-display-label';

type CounselorCurriculumPageProps = {
  navigate(path: string): void;
  studentId: string;
};

export function CounselorCurriculumPage({ navigate, studentId }: CounselorCurriculumPageProps) {
  const [student, setStudent] = useState<CounselorStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const client = useMemo(
    () => createCounselorCurriculumClient(studentId, authClient.authorizedRequest.bind(authClient)),
    [studentId],
  );

  useEffect(() => {
    let active = true;
    studentsClient.get(studentId)
      .then((result) => { if (active) setStudent(result); })
      .catch((loadError: unknown) => { if (active) setError(loadError); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId]);

  if (loading) {
    return <ContentState kind="loading" title="در حال دریافت دانش‌آموز" description="زمینهٔ مجاز دانش‌آموز در حال بررسی است." />;
  }
  if (error || !student) {
    const inaccessible = error instanceof AuthApiError && error.status === 404;
    return (
      <ContentState
        kind="error"
        title={inaccessible ? 'دانش‌آموز در دسترس نیست' : 'دریافت دانش‌آموز انجام نشد'}
        description={inaccessible
          ? 'این دانش‌آموز یافت نشد یا دیگر در فهرست دانش‌آموزان مجاز شما نیست.'
          : 'ارتباط برقرار نشد. از فهرست دانش‌آموزان دوباره تلاش کنید.'}
        action={<Button onClick={() => navigate('/students')}>بازگشت به دانش‌آموزان</Button>}
      />
    );
  }

  return (
    <CurriculumBrowser
      audience="counselor"
      client={client}
      contextLabel={studentDisplayLabel(student)}
      onBack={() => navigate(`/students/${student.id}`)}
    />
  );
}
