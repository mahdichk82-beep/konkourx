import { CurriculumBrowser } from '@konkourx/curriculum-browser';
import '@konkourx/curriculum-browser/styles.css';
import { useMemo } from 'react';

import { authClient } from '../auth/auth-client';
import { createStudentCurriculumClient } from './curriculum-client';

export function StudentCurriculumPage() {
  const client = useMemo(
    () => createStudentCurriculumClient(authClient.authorizedRequest.bind(authClient)),
    [],
  );

  return <CurriculumBrowser audience="student" client={client} />;
}
