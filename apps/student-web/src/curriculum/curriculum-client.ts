import {
  createBoundCurriculumClient,
  type AuthorizedRequest,
  type CurriculumBrowserClient,
} from '@konkourx/curriculum-browser/client';

export function createStudentCurriculumClient(
  request: AuthorizedRequest,
): CurriculumBrowserClient {
  return createBoundCurriculumClient('/student/curriculum', request);
}
