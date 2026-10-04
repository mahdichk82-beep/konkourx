import {
  createBoundCurriculumClient,
  type AuthorizedRequest,
  type CurriculumBrowserClient,
} from '@konkourx/curriculum-browser/client';

export function createCounselorCurriculumClient(
  studentId: string,
  request: AuthorizedRequest,
): CurriculumBrowserClient {
  return createBoundCurriculumClient(
    `/counselor/students/${encodeURIComponent(studentId)}/curriculum`,
    request,
  );
}
