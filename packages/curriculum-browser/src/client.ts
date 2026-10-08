import type {
  CurriculumBrowserClient,
  CurriculumCatalogEntry,
  CurriculumCatalogNodeView,
  CurriculumCatalogRootItem,
  CurriculumCatalogSearchResult,
  CurriculumPage,
} from './types.ts';

export type { CurriculumBrowserClient } from './types.ts';

export type AuthorizedRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

const segment = (value: string) => encodeURIComponent(value);

export function createBoundCurriculumClient(
  basePath: string,
  request: AuthorizedRequest,
): CurriculumBrowserClient {
  const catalogPath = `${basePath}/catalog`;
  return {
    listCatalog: () => request<readonly CurriculumCatalogEntry[]>(catalogPath),
    getEntry: (entryId) => request<CurriculumCatalogEntry>(`${catalogPath}/${segment(entryId)}`),
    listRoots: (entryId) => request<readonly CurriculumCatalogRootItem[]>(
      `${catalogPath}/${segment(entryId)}/roots`,
    ),
    getNode: (entryId, nodeId) => request<CurriculumCatalogNodeView>(
      `${catalogPath}/${segment(entryId)}/nodes/${segment(nodeId)}`,
    ),
    listChildren: (entryId, nodeId, offset = 0, limit = 100) => request<CurriculumPage<CurriculumCatalogNodeView>>(
      `${catalogPath}/${segment(entryId)}/nodes/${segment(nodeId)}/children?limit=${Math.min(100, Math.max(1, limit))}&offset=${offset}`,
    ),
    search: (query, offset = 0) => request<CurriculumPage<CurriculumCatalogSearchResult>>(
      `${basePath}/search?q=${encodeURIComponent(query)}&limit=50&offset=${offset}`,
    ),
  };
}
