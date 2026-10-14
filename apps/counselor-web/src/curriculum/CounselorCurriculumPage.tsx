import { useEffect, useState } from 'react';

import { AuthApiError } from '../auth/auth-client';
import { Button } from '../components/ui/Button';
import { ContentState } from '../components/ui/ContentState';
import { studentsClient } from '../students/students-client';

type CounselorCurriculumPageProps = {
  navigate(path: string, replace?: boolean): void;
  studentId: string;
};

export function CounselorCurriculumPage({ navigate, studentId }: CounselorCurriculumPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    studentsClient.get(studentId)
      .then((result) => {
        if (active) navigate(`/students/${result.id}`, true);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError);
        setLoading(false);
      });
    return () => { active = false; };
  }, [navigate, studentId]);

  if (loading) {
    return <ContentState kind="loading" title="در حال بازگشت به فضای دانش‌آموز" description="دسترسی شما به این دانش‌آموز در حال بررسی است." />;
  }
  if (error) {
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

  return null;
}
