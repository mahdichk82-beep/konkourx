export type CurriculumTrackId = 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES';

export type CurriculumProvenance = {
  kind: 'SOURCE_REPRESENTATION' | 'SOURCE_STATEMENT' | 'PRODUCT_OWNER_APPROVAL';
  reference: string;
};

export type CurriculumCatalogRootItem =
  | { itemKind: 'NODE'; nodeId: string }
  | {
      itemKind: 'GROUP';
      id: string;
      label: string;
      selectable: false;
      childNodeIds: readonly string[];
      provenance?: readonly CurriculumProvenance[];
    };

export type CurriculumCatalogEntry = {
  id: string;
  key: string;
  title: string;
  kind: 'BOOK_BASED' | 'THEMATIC';
  visibleInTracks: readonly CurriculumTrackId[];
  representationIds: readonly string[];
  rootItems: readonly CurriculumCatalogRootItem[];
  nodeCount: number;
  resolutionStatus: 'RESOLVED' | 'AMBIGUOUS' | 'UNRESOLVED';
  ambiguityCodes: readonly string[];
  provenance: readonly CurriculumProvenance[];
};

export type CurriculumCatalogBreadcrumbSegment = {
  kind: 'TRACK' | 'ENTRY' | 'GROUP' | 'NODE';
  id: string;
  label: string;
};

export type CurriculumCatalogNodeView = {
  id: string;
  representationId: string;
  parentId: string | null;
  rawLabel: string;
  sourceOrder: number;
  depth: number;
  sourceLocator: string;
  sourceMarker: string | null;
  childrenCount: number;
  headingMetadata?: { prefix: string };
  trackId: CurriculumTrackId;
  entryId: string;
  breadcrumb: readonly CurriculumCatalogBreadcrumbSegment[];
  ambiguityCodes: readonly string[];
};

export type CurriculumCatalogSearchResult = CurriculumCatalogNodeView;

export type CurriculumPage<T> = {
  items: readonly T[];
  limit: number;
  offset: number;
  total: number;
};

export type CurriculumSelectionMode = 'EXACT' | 'WHOLE';

export type CurriculumSelection = {
  nodeId: string;
  entryId: string;
  label: string;
  breadcrumb: readonly CurriculumCatalogBreadcrumbSegment[];
  trackId: CurriculumTrackId;
  mode: CurriculumSelectionMode;
};

export type CurriculumBrowserClient = {
  listCatalog(): Promise<readonly CurriculumCatalogEntry[]>;
  getEntry(entryId: string): Promise<CurriculumCatalogEntry>;
  listRoots(entryId: string): Promise<readonly CurriculumCatalogRootItem[]>;
  getNode(entryId: string, nodeId: string): Promise<CurriculumCatalogNodeView>;
  listChildren(
    entryId: string,
    nodeId: string,
    offset?: number,
  ): Promise<CurriculumPage<CurriculumCatalogNodeView>>;
  search(query: string, offset?: number): Promise<CurriculumPage<CurriculumCatalogSearchResult>>;
};
