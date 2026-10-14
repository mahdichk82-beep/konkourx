import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  CurriculumBrowserClient,
  CurriculumCatalogEntry,
  CurriculumCatalogNodeView,
  CurriculumCatalogRootItem,
  CurriculumCatalogSearchResult,
} from './types.ts';
import {
  ambiguityNotice,
  errorPresentation,
  presentBreadcrumb,
  presentCatalog,
  type CurriculumAudience,
} from './view-model.ts';

export type CurriculumBrowserProps = {
  client: CurriculumBrowserClient;
  audience: CurriculumAudience;
  onBack?: () => void;
};

type RootBranch = {
  key: string;
  group: Extract<CurriculumCatalogRootItem, { itemKind: 'GROUP' }> | null;
  nodes: readonly CurriculumCatalogNodeView[];
};

type AsyncValue<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; error: unknown };

export function CurriculumBrowser({
  client,
  audience,
  onBack,
}: CurriculumBrowserProps) {
  const [catalog, setCatalog] = useState<AsyncValue<readonly CurriculumCatalogEntry[]>>({ status: 'loading' });
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [roots, setRoots] = useState<AsyncValue<readonly RootBranch[]>>({ status: 'idle' });
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<AsyncValue<readonly CurriculumCatalogSearchResult[]>>({ status: 'idle' });
  const [revealPath, setRevealPath] = useState<ReadonlySet<string>>(new Set());
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const loadCatalog = useCallback(async () => {
    setCatalog({ status: 'loading' });
    try {
      const entries = await client.listCatalog();
      setCatalog({ status: 'ready', value: entries });
      if (entries.length > 0) setActiveEntryId((current) => current ?? entries[0].id);
    } catch (error) {
      setCatalog({ status: 'error', error });
    }
  }, [client]);

  useEffect(() => { void loadCatalog(); }, [loadCatalog]);

  const loadEntry = useCallback(async (entryId: string) => {
    setActiveEntryId(entryId);
    setRoots({ status: 'loading' });
    try {
      const rootItems = await client.listRoots(entryId);
      const branches = await Promise.all(rootItems.map(async (root): Promise<RootBranch> => {
        if (root.itemKind === 'GROUP') {
          return {
            key: root.id,
            group: root,
            nodes: await Promise.all(root.childNodeIds.map((nodeId) => client.getNode(entryId, nodeId))),
          };
        }
        return {
          key: root.nodeId,
          group: null,
          nodes: [await client.getNode(entryId, root.nodeId)],
        };
      }));
      setRoots({ status: 'ready', value: branches });
    } catch (error) {
      setRoots({ status: 'error', error });
    }
  }, [client]);

  useEffect(() => {
    if (activeEntryId) void loadEntry(activeEntryId);
  }, [activeEntryId, loadEntry]);

  const submitSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) {
      setSearch({ status: 'ready', value: [] });
      return;
    }
    setSearch({ status: 'loading' });
    try {
      const result = await client.search(normalized);
      setSearch({ status: 'ready', value: result.items });
    } catch (error) {
      setSearch({ status: 'error', error });
    }
  };

  const openSearchResult = (result: CurriculumCatalogSearchResult) => {
    setRevealPath(new Set(result.breadcrumb.filter(({ kind }) => kind === 'NODE').map(({ id }) => id)));
    setFocusedNodeId(result.id);
    setActiveEntryId(result.entryId);
  };

  if (catalog.status === 'loading' || catalog.status === 'idle') {
    return <StatusPanel title="در حال بارگذاری مباحث درسی…" busy />;
  }
  if (catalog.status === 'error') {
    return <ErrorPanel error={catalog.error} audience={audience} retry={loadCatalog} />;
  }
  const catalogEntries = catalog.value;
  const entries = presentCatalog(catalogEntries);
  const activeEntry = entries.find(({ id }) => id === activeEntryId) ?? null;

  return (
    <main className="curriculum-browser" dir="rtl">
      <header className="curriculum-browser__hero">
        <div>
          {onBack ? <button className="curriculum-browser__back" type="button" onClick={onBack}>بازگشت</button> : null}
          <p className="curriculum-browser__eyebrow">مرور برنامهٔ درسی رسمی</p>
          <h2>مباحث درسی</h2>
          <p>درس‌ها و مباحث رشتهٔ خود را در ساختار رسمی مرور کنید یا با جست‌وجو مستقیماً به مسیر هر مبحث بروید.</p>
        </div>
      </header>

      <section className="curriculum-browser__toolbar" aria-label="ابزارهای مرور">
        <form className="curriculum-browser__search" onSubmit={submitSearch} role="search">
          <label htmlFor="curriculum-search">جست‌وجوی مبحث</label>
          <div>
            <input
              id="curriculum-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="مثلاً سلول، تابع یا آرایه…"
            />
            <button type="submit">جست‌وجو</button>
          </div>
        </form>
      </section>

      <SearchResults
        state={search}
        entries={catalogEntries}
        onOpen={openSearchResult}
        audience={audience}
        retry={() => void submitSearch({ preventDefault() {} } as React.FormEvent)}
      />

      {catalogEntries.length === 0 ? (
        <StatusPanel title="مبحثی برای رشتهٔ شما ثبت نشده است" detail="پس از تکمیل فهرست رسمی، موضوع‌ها در همین صفحه نمایش داده می‌شوند." />
      ) : (
        <div className="curriculum-browser__workspace">
          <nav className="curriculum-browser__catalog" aria-label="درس‌ها و نماهای برنامهٔ درسی">
            <h2>درس‌ها و نماها</h2>
            {entries.map((entry) => (
              <button
                className={entry.id === activeEntryId ? 'is-active' : ''}
                type="button"
                key={entry.id}
                aria-current={entry.id === activeEntryId ? 'page' : undefined}
                onClick={() => {
                  setFocusedNodeId(null);
                  setRevealPath(new Set());
                  setActiveEntryId(entry.id);
                }}
              >
                <span>{entry.title}</span>
                {entry.badge ? <small>{entry.badge}</small> : null}
                <b>{entry.nodeCount.toLocaleString('fa-IR')} مبحث</b>
              </button>
            ))}
          </nav>

          <section className="curriculum-browser__tree-panel" aria-live="polite">
            <div className="curriculum-browser__tree-heading">
              <div>
                <p className="curriculum-browser__eyebrow">ساختار رسمی و قابل بازشدن</p>
                <h2>{activeEntry?.title ?? 'ساختار درس'}</h2>
              </div>
              {activeEntry?.kind === 'THEMATIC' ? <span className="curriculum-browser__badge">نمای موضوعی</span> : null}
            </div>
            {activeEntry && ambiguityNotice(activeEntry) ? (
              <p className="curriculum-browser__notice">{ambiguityNotice(activeEntry)}</p>
            ) : null}
            {focusedNodeId ? <p className="curriculum-browser__reveal">مسیر نتیجهٔ جست‌وجو در درخت باز شده است.</p> : null}
            {roots.status === 'loading' || roots.status === 'idle' ? <StatusPanel title="در حال بارگذاری ساختار…" busy /> : null}
            {roots.status === 'error' ? (
              <ErrorPanel error={roots.error} audience={audience} retry={() => activeEntryId && loadEntry(activeEntryId)} />
            ) : null}
            {roots.status === 'ready' && roots.value.length === 0 ? (
              <StatusPanel title="ساختاری برای این ورودی موجود نیست" detail="یک درس یا نمای دیگر را انتخاب کنید." />
            ) : null}
            {roots.status === 'ready' ? roots.value.map((branch) => (
              branch.group?.itemKind === 'GROUP' ? (
                <section className="curriculum-browser__group" key={branch.key} aria-labelledby={`group-${branch.key}`}>
                  <h3 id={`group-${branch.key}`}>{branch.group.label}</h3>
                  <p>گروه راهبری</p>
                  <div className="curriculum-browser__tree" role="tree">
                    {branch.nodes.map((node) => (
                      <TreeNode key={node.id} {...treeNodeProps(node)} />
                    ))}
                  </div>
                </section>
              ) : (
                <div className="curriculum-browser__tree" role="tree" key={branch.key}>
                  {branch.nodes.map((node) => <TreeNode key={node.id} {...treeNodeProps(node)} />)}
                </div>
              )
            )) : null}
          </section>
        </div>
      )}
    </main>
  );

  function treeNodeProps(node: CurriculumCatalogNodeView): TreeNodeProps {
    return { client, node, revealPath, focusedNodeId };
  }
}

type TreeNodeProps = {
  client: CurriculumBrowserClient;
  node: CurriculumCatalogNodeView;
  revealPath: ReadonlySet<string>;
  focusedNodeId: string | null;
};

function TreeNode({ client, node, revealPath, focusedNodeId }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<AsyncValue<readonly CurriculumCatalogNodeView[]>>({ status: 'idle' });
  const [loadedCount, setLoadedCount] = useState(0);
  const revealed = revealPath.has(node.id);
  const open = expanded || revealed;
  const loadChildren = useCallback(async (offset = 0) => {
    if (node.childrenCount === 0) return;
    setChildren({ status: 'loading' });
    try {
      const page = await client.listChildren(node.entryId, node.id, offset);
      setChildren((current) => ({
        status: 'ready',
        value: offset > 0 && current.status === 'ready' ? [...current.value, ...page.items] : page.items,
      }));
      setLoadedCount(offset + page.items.length);
    } catch (error) {
      setChildren({ status: 'error', error });
    }
  }, [client, node.childrenCount, node.entryId, node.id]);

  useEffect(() => {
    if (open && children.status === 'idle') void loadChildren();
  }, [children.status, loadChildren, open]);

  return (
    <div className="curriculum-browser__node" role="treeitem" aria-expanded={node.childrenCount > 0 ? open : undefined}>
      <div className={`curriculum-browser__node-row${focusedNodeId === node.id ? ' is-focused' : ''}`}>
        {node.childrenCount > 0 ? (
          <button className="curriculum-browser__expand" type="button" aria-expanded={open} aria-label={open ? 'بستن زیرمبحث‌ها' : 'بازکردن زیرمبحث‌ها'} onClick={() => setExpanded(!open)}>
            <span aria-hidden="true">{open ? '−' : '+'}</span>
          </button>
        ) : <span className="curriculum-browser__leaf" aria-hidden="true">•</span>}
        <div className="curriculum-browser__node-select">
          <span>{node.rawLabel}</span>
          <small>{node.childrenCount > 0 ? `${node.childrenCount.toLocaleString('fa-IR')} زیرمبحث` : 'مبحث پایانی'}</small>
        </div>
      </div>
      {open ? (
        <div className="curriculum-browser__children" role="group">
          {children.status === 'loading' ? <p className="curriculum-browser__inline-state">در حال دریافت زیرمبحث‌ها…</p> : null}
          {children.status === 'error' ? <button className="curriculum-browser__retry" type="button" onClick={() => void loadChildren()}>تلاش دوباره برای این شاخه</button> : null}
          {children.status === 'ready' ? children.value.map((child) => (
            <TreeNode key={child.id} client={client} node={child} revealPath={revealPath} focusedNodeId={focusedNodeId} />
          )) : null}
          {children.status === 'ready' && loadedCount < node.childrenCount ? (
            <button className="curriculum-browser__retry" type="button" onClick={() => void loadChildren(loadedCount)}>نمایش موارد بیشتر</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SearchResults({ state, entries, onOpen, audience, retry }: {
  state: AsyncValue<readonly CurriculumCatalogSearchResult[]>;
  entries: readonly CurriculumCatalogEntry[];
  onOpen(result: CurriculumCatalogSearchResult): void;
  audience: CurriculumAudience;
  retry(): void;
}) {
  if (state.status === 'idle') return null;
  return (
    <section className="curriculum-browser__results" aria-live="polite">
      <div className="curriculum-browser__results-heading">
        <h2>نتایج جست‌وجو</h2>
        {state.status === 'ready' ? <span>{state.value.length.toLocaleString('fa-IR')} نتیجه</span> : null}
      </div>
      {state.status === 'loading' ? <StatusPanel title="در حال جست‌وجو…" busy /> : null}
      {state.status === 'error' ? <ErrorPanel error={state.error} audience={audience} retry={retry} /> : null}
      {state.status === 'ready' && state.value.length === 0 ? <StatusPanel title="نتیجه‌ای پیدا نشد" detail="عبارت کوتاه‌تر یا واژهٔ دیگری را امتحان کنید." /> : null}
      {state.status === 'ready' ? state.value.map((result) => {
        const entry = entries.find(({ id }) => id === result.entryId);
        return (
          <article className="curriculum-browser__result" key={`${result.entryId}:${result.id}`}>
            <div>
              <span>{entry?.title ?? 'ورودی برنامهٔ درسی'}</span>
              <h3>{result.rawLabel}</h3>
              <p>{presentBreadcrumb(result.breadcrumb)}</p>
            </div>
            <div>
              <button type="button" onClick={() => onOpen(result)}>نمایش در ساختار</button>
            </div>
          </article>
        );
      }) : null}
    </section>
  );
}

function StatusPanel({ title, detail, busy = false }: { title: string; detail?: string; busy?: boolean }) {
  return <div className="curriculum-browser__status" role="status" aria-busy={busy}><strong>{title}</strong>{detail ? <p>{detail}</p> : null}</div>;
}

function ErrorPanel({ error, audience, retry }: { error: unknown; audience: CurriculumAudience; retry(): void }) {
  const presentation = useMemo(() => errorPresentation(error, audience), [audience, error]);
  return (
    <div className={`curriculum-browser__status is-error is-${presentation.kind.toLowerCase()}`} role="alert">
      <strong>{presentation.title}</strong>
      <p>{presentation.description}</p>
      {presentation.kind !== 'INACCESSIBLE_STUDENT' ? <button type="button" onClick={retry}>تلاش دوباره</button> : null}
    </div>
  );
}
