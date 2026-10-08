import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  confirmedPlanningCurriculumValue,
  type PlanningCurriculumValue,
  type PlanningCurriculumSelectorSummary,
} from './planning.ts';
import {
  childPageToSelectionFact,
  invalidatesSelectionSession,
  nodeViewToSelectionFact,
  rootItemsToSelectionGroupFacts,
  runSelectionOperationWithRetry,
  selectionAdapterErrorText,
} from './selection-adapter.ts';
import {
  createTriStateSelectionState,
  queryNavigationGroupSelection,
  queryNodeSelection,
  registerTriStateSelectionFacts,
  serializeTriStateSelection,
  toggleNavigationGroup,
  toggleNode,
  type CurriculumCheckboxState,
  type TriStateSelectionState,
} from './selection-engine.ts';
import type {
  CurriculumBrowserClient,
  CurriculumCatalogEntry,
  CurriculumCatalogNodeView,
  CurriculumCatalogRootItem,
} from './types.ts';

export type PickerAsyncState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; error: unknown };

export type PickerCheckboxState = CurriculumCheckboxState | 'UNKNOWN_LOADING';

type RootState = {
  entryId: string;
  items: readonly CurriculumCatalogRootItem[];
};

let modalGeneration = 0;

const nextGeneration = (): string => {
  modalGeneration += 1;
  return `curriculum-picker-modal-${modalGeneration}`;
};

export function useTriStateCurriculumPicker(
  client: CurriculumBrowserClient,
  initialValue: Extract<PlanningCurriculumValue, { kind: 'V2' }>,
) {
  const generation = useMemo(() => nextGeneration(), [client]);
  const generationRef = useRef(generation);
  generationRef.current = generation;
  const active = useRef(true);
  const entryRequest = useRef(0);
  const searchRequest = useRef(0);
  const operationInFlight = useRef(false);
  const selectionChangedRef = useRef(false);
  const invalidatedRef = useRef(false);
  const failedQueries = useRef(new Set<string>());
  const pendingOperationRef = useRef<{
    operation: Parameters<typeof runSelectionOperationWithRetry>[1];
    marksSelectionChange: boolean;
  } | null>(null);
  const engineRef = useRef<TriStateSelectionState | null>(null);
  const nodeEntryHints = useRef<Record<string, string>>({});
  const groupEntryHints = useRef<Record<string, string>>({});
  const groupLabels = useRef<Record<string, string>>({});

  const [catalog, setCatalog] = useState<PickerAsyncState<readonly CurriculumCatalogEntry[]>>({ status: 'loading' });
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [roots, setRoots] = useState<PickerAsyncState<RootState>>({ status: 'idle' });
  const [views, setViews] = useState<Readonly<Record<string, CurriculumCatalogNodeView>>>({});
  const [children, setChildren] = useState<Readonly<Record<string, PickerAsyncState<readonly CurriculumCatalogNodeView[]>>>>({});
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<PickerAsyncState<readonly CurriculumCatalogNodeView[]>>({ status: 'idle' });
  const [engine, setEngine] = useState<TriStateSelectionState | null>(null);
  const [busy, setBusy] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<{ limit: number; rawCount: number; normalizedCount: number } | null>(null);

  const publishEngine = useCallback((next: TriStateSelectionState) => {
    engineRef.current = next;
    setEngine(next);
  }, []);

  const invalidateSession = useCallback((message: string) => {
    invalidatedRef.current = true;
    pendingOperationRef.current = null;
    setInvalidated(true);
    setOperationError(message);
  }, []);

  const rememberViews = useCallback((items: readonly CurriculumCatalogNodeView[]) => {
    if (items.length === 0) return;
    for (const item of items) {
      nodeEntryHints.current[item.id] = item.entryId;
      for (const segment of item.breadcrumb) {
        if (segment.kind === 'NODE') nodeEntryHints.current[segment.id] = item.entryId;
      }
    }
    setViews((current) => {
      const next = { ...current };
      for (const item of items) next[item.id] = item;
      return next;
    });
  }, []);

  const registerViews = useCallback((
    items: readonly CurriculumCatalogNodeView[],
    rootItems: readonly CurriculumCatalogRootItem[] = [],
  ): TriStateSelectionState | null => {
    if (!active.current || generationRef.current !== generation) return null;
    if (items.length === 0 && !engineRef.current) return null;
    let current = engineRef.current;
    if (!current) {
      const first = items[0];
      if (!first) return null;
      current = createTriStateSelectionState({
        trackId: first.trackId,
        catalogRevision: generation,
      }, initialValue.selection);
    }
    if (items.some(({ trackId }) => trackId !== current.authority.trackId)) {
      invalidateSession('اطلاعات رشته با این پنجره انتخاب سازگار نیست. پنجره را ببندید و دوباره باز کنید.');
      return null;
    }
    const registered = registerTriStateSelectionFacts(current, {
      authority: current.authority,
      nodes: items.map(nodeViewToSelectionFact),
      groups: rootItemsToSelectionGroupFacts(rootItems),
    });
    if (registered.kind !== 'REGISTERED') {
      invalidateSession('ساختار دریافتی با اطلاعات این پنجره سازگار نیست. پنجره را دوباره باز کنید.');
      return null;
    }
    rememberViews(items);
    publishEngine(registered.state);
    return registered.state;
  }, [generation, initialValue.selection, invalidateSession, publishEngine, rememberViews]);

  const loadEntry = useCallback(async (entryId: string) => {
    const requestId = entryRequest.current + 1;
    entryRequest.current = requestId;
    setActiveEntryId(entryId);
    setRoots({ status: 'loading' });
    setOperationError(null);
    try {
      const rootItems = await client.listRoots(entryId);
      if (!active.current || generationRef.current !== generation || requestId !== entryRequest.current) return;
      const rootIds = [...new Set(rootItems.flatMap((item) => (
        item.itemKind === 'NODE' ? [item.nodeId] : [...item.childNodeIds]
      )))];
      for (const item of rootItems) {
        if (item.itemKind === 'GROUP') {
          groupEntryHints.current[item.id] = entryId;
          groupLabels.current[item.id] = item.label;
        }
        for (const nodeId of item.itemKind === 'NODE' ? [item.nodeId] : item.childNodeIds) {
          nodeEntryHints.current[nodeId] = entryId;
        }
      }
      const rootViews = await Promise.all(rootIds.map((nodeId) => client.getNode(entryId, nodeId)));
      if (!active.current || generationRef.current !== generation || requestId !== entryRequest.current) return;
      if (rootViews.length > 0 && !registerViews(rootViews, rootItems)) return;
      setRoots({ status: 'ready', value: { entryId, items: rootItems } });
    } catch (error) {
      if (active.current && generationRef.current === generation && requestId === entryRequest.current) setRoots({ status: 'error', error });
    }
  }, [client, generation, registerViews]);

  const loadCatalog = useCallback(async () => {
    setCatalog({ status: 'loading' });
    try {
      const entries = await client.listCatalog();
      if (!active.current || generationRef.current !== generation) return;
      for (const summary of initialValue.summaries) {
        if (!summary.representationIdSnapshot) continue;
        const entry = entries.find(({ representationIds }) => (
          representationIds.includes(summary.representationIdSnapshot as string)
        ));
        if (entry) nodeEntryHints.current[summary.rootId] = entry.id;
      }
      setCatalog({ status: 'ready', value: entries });
      const firstEntry = entries[0];
      if (firstEntry) void loadEntry(firstEntry.id);
    } catch (error) {
      if (active.current && generationRef.current === generation) setCatalog({ status: 'error', error });
    }
  }, [client, generation, initialValue.summaries, loadEntry]);

  useEffect(() => {
    active.current = true;
    operationInFlight.current = false;
    selectionChangedRef.current = false;
    invalidatedRef.current = false;
    failedQueries.current = new Set();
    pendingOperationRef.current = null;
    engineRef.current = null;
    nodeEntryHints.current = {};
    groupEntryHints.current = {};
    groupLabels.current = {};
    entryRequest.current += 1;
    searchRequest.current += 1;
    setEngine(null);
    setViews({});
    setChildren({});
    setExpanded(new Set());
    setRoots({ status: 'idle' });
    setSearch({ status: 'idle' });
    setOperationError(null);
    setLimitError(null);
    setBusy(false);
    setInvalidated(false);
    void loadCatalog();
    return () => { active.current = false; };
  }, [generation, loadCatalog]);

  const registerChildPage = useCallback((
    parentId: string,
    page: Awaited<ReturnType<CurriculumBrowserClient['listChildren']>>,
  ) => {
    const current = engineRef.current;
    if (!current || page.items.some(({ trackId }) => trackId !== current.authority.trackId)) {
      invalidateSession('ساختار این شاخه با رشته انتخاب‌شده سازگار نیست.');
      return false;
    }
    const registered = registerTriStateSelectionFacts(current, {
      authority: current.authority,
      childPages: [childPageToSelectionFact(parentId, page)],
    });
    if (registered.kind !== 'REGISTERED') {
      invalidateSession('اطلاعات این شاخه با ساختار بارگذاری‌شده سازگار نیست.');
      return false;
    }
    rememberViews(page.items);
    publishEngine(registered.state);
    return true;
  }, [invalidateSession, publishEngine, rememberViews]);

  const loadChildren = useCallback(async (node: CurriculumCatalogNodeView, offset = 0) => {
    const previous = children[node.id];
    const previousItems = offset > 0 && previous?.status === 'ready'
      ? previous.value
      : [];
    setChildren((current) => ({ ...current, [node.id]: { status: 'loading' } }));
    try {
      const page = await client.listChildren(node.entryId, node.id, offset, 100);
      if (!active.current || generationRef.current !== generation || !registerChildPage(node.id, page)) return;
      setChildren((current) => ({
        ...current,
        [node.id]: { status: 'ready', value: [...previousItems, ...page.items] },
      }));
    } catch (error) {
      if (active.current && generationRef.current === generation) setChildren((current) => ({ ...current, [node.id]: { status: 'error', error } }));
    }
  }, [children, client, generation, registerChildPage]);

  const toggleExpanded = useCallback((node: CurriculumCatalogNodeView) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  }, []);

  const applyOperation = useCallback(async (
    operation: Parameters<typeof runSelectionOperationWithRetry>[1],
    marksSelectionChange = false,
  ) => {
    const current = engineRef.current;
    if (!current || invalidatedRef.current || operationInFlight.current) return;
    operationInFlight.current = true;
    pendingOperationRef.current = { operation, marksSelectionChange };
    setBusy(true);
    setOperationError(null);
    setLimitError(null);
    try {
      const result = await runSelectionOperationWithRetry(current, operation, {
        authority: current.authority,
        client,
        generation,
        isCurrentGeneration: (candidate) => active.current
          && generationRef.current === generation
          && candidate === generation,
        nodeEntryHints: nodeEntryHints.current,
        groupEntryHints: groupEntryHints.current,
      });
      if (!active.current || generationRef.current !== generation) return result;
      if (result.kind === 'UPDATED' || result.kind === 'QUERIED' || result.kind === 'SERIALIZED' || result.kind === 'SELECTOR_LIMIT_EXCEEDED') {
        nodeEntryHints.current = { ...result.nodeEntryHints };
        groupEntryHints.current = { ...result.groupEntryHints };
        rememberViews(result.nodeViews);
      }
      if (result.kind === 'UPDATED' || result.kind === 'QUERIED' || result.kind === 'SERIALIZED') {
        publishEngine(result.state);
        pendingOperationRef.current = null;
        if (result.kind === 'UPDATED' && marksSelectionChange) selectionChangedRef.current = true;
      } else if (result.kind === 'SELECTOR_LIMIT_EXCEEDED') {
        pendingOperationRef.current = null;
        setLimitError(result);
      } else if (result.kind === 'ADAPTER_FAILURE') {
        setOperationError(selectionAdapterErrorText(result));
        if (invalidatesSelectionSession(result)) invalidateSession(selectionAdapterErrorText(result));
        else if (!result.retryable) pendingOperationRef.current = null;
      } else if (result.kind === 'STALE') {
        pendingOperationRef.current = null;
        setOperationError('این پنجره قدیمی شده است. آن را ببندید و دوباره باز کنید.');
      }
      return result;
    } finally {
      operationInFlight.current = false;
      if (active.current && generationRef.current === generation) setBusy(false);
    }
  }, [client, generation, invalidateSession, publishEngine, rememberViews]);

  const checkboxState = useCallback((nodeId: string): PickerCheckboxState => {
    if (!engine) return 'UNKNOWN_LOADING';
    const result = queryNodeSelection(engine, nodeId);
    return result.kind === 'KNOWN' ? result.value : 'UNKNOWN_LOADING';
  }, [engine]);

  const groupCheckboxState = useCallback((groupId: string): PickerCheckboxState => {
    if (!engine) return 'UNKNOWN_LOADING';
    const result = queryNavigationGroupSelection(engine, groupId);
    return result.kind === 'KNOWN' ? result.value : 'UNKNOWN_LOADING';
  }, [engine]);

  const toggleNodeSelection = useCallback((nodeId: string) => (
    applyOperation((state) => toggleNode(state, nodeId), true)
  ), [applyOperation]);

  const toggleGroup = useCallback((groupId: string) => (
    applyOperation((state) => toggleNavigationGroup(state, groupId), true)
  ), [applyOperation]);

  const ensureNodeSelectionState = useCallback((nodeId: string) => {
    const key = `node:${nodeId}`;
    const current = engineRef.current;
    if (!current || invalidatedRef.current || failedQueries.current.has(key)) return;
    if (queryNodeSelection(current, nodeId).kind === 'KNOWN') return;
    void applyOperation((state) => queryNodeSelection(state, nodeId)).then((result) => {
      if (result?.kind === 'ADAPTER_FAILURE') failedQueries.current.add(key);
    });
  }, [applyOperation]);

  const ensureGroupSelectionState = useCallback((groupId: string) => {
    const key = `group:${groupId}`;
    const current = engineRef.current;
    if (!current || invalidatedRef.current || failedQueries.current.has(key)) return;
    if (queryNavigationGroupSelection(current, groupId).kind === 'KNOWN') return;
    void applyOperation((state) => queryNavigationGroupSelection(state, groupId)).then((result) => {
      if (result?.kind === 'ADAPTER_FAILURE') failedQueries.current.add(key);
    });
  }, [applyOperation]);

  const submitSearch = useCallback(async () => {
    const requestId = searchRequest.current + 1;
    searchRequest.current = requestId;
    const normalized = query.trim();
    if (!normalized) {
      setSearch({ status: 'idle' });
      return;
    }
    setSearch({ status: 'loading' });
    try {
      const page = await client.search(normalized, 0);
      if (!active.current || generationRef.current !== generation || requestId !== searchRequest.current) return;
      if (page.items.length > 0 && !registerViews(page.items)) return;
      setSearch({ status: 'ready', value: page.items });
    } catch (error) {
      if (active.current && generationRef.current === generation && requestId === searchRequest.current) setSearch({ status: 'error', error });
    }
  }, [client, generation, query, registerViews]);

  const revealSearchResult = useCallback((result: CurriculumCatalogNodeView) => {
    setActiveEntryId(result.entryId);
    setExpanded((current) => new Set([
      ...current,
      ...result.breadcrumb.filter(({ kind }) => kind === 'NODE').map(({ id }) => id),
    ]));
    void loadEntry(result.entryId);
  }, [loadEntry]);

  const confirm = useCallback(async (): Promise<Extract<PlanningCurriculumValue, { kind: 'V2' }> | null> => {
    if (invalidatedRef.current) return null;
    const current = engineRef.current;
    if (!current) {
      setOperationError('برای تأیید، ابتدا ساختار رشته باید بارگذاری شود.');
      return null;
    }
    const result = await applyOperation(serializeTriStateSelection);
    if (!result || result.kind !== 'SERIALIZED') return null;
    const knownSummaries = new Map(initialValue.summaries.map((summary) => (
      [`${summary.rootKind}:${summary.rootId}`, summary] as const
    )));
    const summaries = result.value.selectors.map((selector): PlanningCurriculumSelectorSummary => {
      const node = views[selector.rootId] ?? result.nodeViews.find(({ id }) => id === selector.rootId);
      const restored = knownSummaries.get(`${selector.rootKind}:${selector.rootId}`);
      return {
        rootKind: selector.rootKind,
        rootId: selector.rootId,
        label: node?.rawLabel ?? groupLabels.current[selector.rootId] ?? restored?.label ?? selector.rootId,
        path: node
          ? node.breadcrumb.filter(({ kind }) => kind !== 'TRACK').map(({ label }) => label)
          : restored?.path ?? (groupLabels.current[selector.rootId] ? [groupLabels.current[selector.rootId]] : []),
        ...(node?.representationId || restored?.representationIdSnapshot
          ? { representationIdSnapshot: node?.representationId ?? restored?.representationIdSnapshot }
          : {}),
      };
    });
    return confirmedPlanningCurriculumValue(
      initialValue,
      result.value,
      summaries,
      selectionChangedRef.current,
    );
  }, [applyOperation, initialValue, views]);

  const retryOperation = useCallback(() => {
    const pending = pendingOperationRef.current;
    if (!pending || invalidatedRef.current) return;
    failedQueries.current = new Set();
    void applyOperation(pending.operation, pending.marksSelectionChange);
  }, [applyOperation]);

  const selectedCount = engine?.selection.selectors.length ?? initialValue.selection.selectors.length;
  return {
    catalog,
    activeEntryId,
    setActiveEntryId: (entryId: string) => void loadEntry(entryId),
    roots,
    views,
    children,
    expanded,
    toggleExpanded,
    loadChildren,
    query,
    setQuery,
    search,
    submitSearch,
    revealSearchResult,
    checkboxState,
    groupCheckboxState,
    toggleNodeSelection,
    toggleGroup,
    ensureNodeSelectionState,
    ensureGroupSelectionState,
    engine,
    busy,
    invalidated,
    operationError,
    canRetryOperation: pendingOperationRef.current !== null && !invalidated,
    limitError,
    selectedCount,
    confirm,
    retryOperation,
    retryCatalog: loadCatalog,
  };
}
