import { useEffect, useRef } from 'react';

import type { PlanningCurriculumValue } from './planning.ts';
import type { PickerCheckboxState } from './useTriStateCurriculumPicker.ts';
import { useTriStateCurriculumPicker } from './useTriStateCurriculumPicker.ts';
import type {
  CurriculumBrowserClient,
  CurriculumCatalogNodeView,
  CurriculumCatalogRootItem,
} from './types.ts';
import { errorPresentation, presentBreadcrumb, type CurriculumAudience } from './view-model.ts';

export type TriStateCurriculumPickerProps = {
  audience: CurriculumAudience;
  client: CurriculumBrowserClient;
  contextLabel?: string;
  initialValue: Extract<PlanningCurriculumValue, { kind: 'V2' }>;
  minimumOne?: boolean;
  replacementNotice?: string;
  onCancel(): void;
  onConfirm(value: Extract<PlanningCurriculumValue, { kind: 'V2' }>): void;
};

function TriStateCheckbox({
  state,
  disabled,
  label,
  onChange,
}: {
  state: PickerCheckboxState;
  disabled: boolean;
  label: string;
  onChange(): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = state === 'INDETERMINATE';
  }, [state]);
  const unknown = state === 'UNKNOWN_LOADING';
  return (
    <input
      aria-busy={unknown || undefined}
      aria-label={unknown ? `${label}، در حال بررسی` : label}
      checked={state === 'CHECKED'}
      data-state={state.toLowerCase()}
      disabled={disabled || unknown}
      onChange={onChange}
      ref={inputRef}
      type="checkbox"
    />
  );
}

function PickerError({ error, audience, retry }: {
  error: unknown;
  audience: CurriculumAudience;
  retry(): void;
}) {
  const presentation = errorPresentation(error, audience);
  return (
    <div className="tri-state-picker__message is-error" role="alert">
      <strong>{presentation.title}</strong>
      <p>{presentation.description}</p>
      {presentation.kind !== 'INACCESSIBLE_STUDENT' ? (
        <button type="button" onClick={retry}>تلاش دوباره</button>
      ) : null}
    </div>
  );
}

type PickerNodeProps = {
  node: CurriculumCatalogNodeView;
  picker: ReturnType<typeof useTriStateCurriculumPicker>;
  depth?: number;
};

function PickerNode({ node, picker, depth = 0 }: PickerNodeProps) {
  const open = picker.expanded.has(node.id);
  const childState = picker.children[node.id];
  const checkbox = picker.checkboxState(node.id);
  const loadedChildren = childState?.status === 'ready' ? childState.value : [];
  useEffect(() => {
    if (open && node.childrenCount > 0 && !childState) void picker.loadChildren(node);
  }, [childState, node, open, picker]);
  useEffect(() => {
    if (checkbox === 'UNKNOWN_LOADING') picker.ensureNodeSelectionState(node.id);
  }, [checkbox, node.id, picker]);
  return (
    <div className="tri-state-picker__node" style={{ '--picker-depth': Math.min(depth, 6) } as React.CSSProperties}>
      <div className="tri-state-picker__node-row" aria-busy={checkbox === 'UNKNOWN_LOADING' || undefined}>
        {node.childrenCount > 0 ? (
          <button
            aria-expanded={open}
            aria-label={open ? `بستن زیرمبحث‌های ${node.rawLabel}` : `بازکردن زیرمبحث‌های ${node.rawLabel}`}
            className="tri-state-picker__expand"
            onClick={() => picker.toggleExpanded(node)}
            type="button"
          >
            <span aria-hidden="true">{open ? '−' : '+'}</span>
          </button>
        ) : <span className="tri-state-picker__leaf" aria-hidden="true">•</span>}
        <label className="tri-state-picker__check-label">
          <TriStateCheckbox
            disabled={picker.busy || picker.invalidated}
            label={`انتخاب ${node.rawLabel}`}
            onChange={() => void picker.toggleNodeSelection(node.id)}
            state={checkbox}
          />
          <span>{node.rawLabel}</span>
          <small>{node.childrenCount > 0 ? `${node.childrenCount.toLocaleString('fa-IR')} زیرمبحث` : 'مبحث پایانی'}</small>
        </label>
      </div>
      {open ? (
        <div className="tri-state-picker__children" role="group">
          {childState?.status === 'loading' || !childState ? <p role="status">در حال دریافت زیرمبحث‌ها…</p> : null}
          {childState?.status === 'error' ? (
            <button type="button" onClick={() => void picker.loadChildren(node)}>تلاش دوباره برای این شاخه</button>
          ) : null}
          {loadedChildren.map((child) => (
            <PickerNode depth={depth + 1} key={child.id} node={child} picker={picker} />
          ))}
          {childState?.status === 'ready' && loadedChildren.length < node.childrenCount ? (
            <button type="button" onClick={() => void picker.loadChildren(node, loadedChildren.length)}>نمایش موارد بیشتر</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RootItem({ item, picker }: {
  item: CurriculumCatalogRootItem;
  picker: ReturnType<typeof useTriStateCurriculumPicker>;
}) {
  const groupId = item.itemKind === 'GROUP' ? item.id : null;
  const groupState = groupId ? picker.groupCheckboxState(groupId) : null;
  useEffect(() => {
    if (groupId && groupState === 'UNKNOWN_LOADING') picker.ensureGroupSelectionState(groupId);
  }, [groupId, groupState, picker]);
  if (item.itemKind === 'NODE') {
    const node = picker.views[item.nodeId];
    return node ? <PickerNode node={node} picker={picker} /> : <p role="status">در حال آماده‌سازی مبحث…</p>;
  }
  return (
    <section className="tri-state-picker__group" aria-labelledby={`picker-group-${item.id}`}>
      <header>
        <label>
          <TriStateCheckbox
            disabled={picker.busy || picker.invalidated}
            label={`انتخاب گروه ${item.label}`}
            onChange={() => void picker.toggleGroup(item.id)}
            state={groupState ?? 'UNKNOWN_LOADING'}
          />
          <strong id={`picker-group-${item.id}`}>{item.label}</strong>
        </label>
      </header>
      <div className="tri-state-picker__tree">
        {item.childNodeIds.map((nodeId) => {
          const node = picker.views[nodeId];
          return node ? <PickerNode key={nodeId} node={node} picker={picker} /> : <p key={nodeId} role="status">در حال آماده‌سازی مبحث…</p>;
        })}
      </div>
    </section>
  );
}

export function TriStateCurriculumPicker({
  audience,
  client,
  contextLabel,
  initialValue,
  minimumOne = false,
  replacementNotice,
  onCancel,
  onConfirm,
}: TriStateCurriculumPickerProps) {
  const picker = useTriStateCurriculumPicker(client, initialValue);
  const confirm = async () => {
    if (minimumOne && picker.selectedCount === 0) return;
    const value = await picker.confirm();
    if (value && (!minimumOne || value.selection.selectors.length > 0)) onConfirm(value);
  };

  return (
    <div className="tri-state-picker" dir="rtl" aria-busy={picker.busy || undefined}>
      <header className="tri-state-picker__header">
        <div>
          <strong>مباحث درسی</strong>
          {contextLabel ? <small>انتخاب برای {contextLabel}</small> : null}
        </div>
        <button type="button" onClick={onCancel} aria-label="بستن پنجره انتخاب">×</button>
      </header>

      {replacementNotice ? <p className="tri-state-picker__replacement">{replacementNotice}</p> : null}

      <div className="tri-state-picker__search" role="search">
        <label htmlFor={`tri-state-search-${audience}`}>جست‌وجوی مبحث</label>
        <div>
          <input
            id={`tri-state-search-${audience}`}
            disabled={picker.invalidated}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                void picker.submitSearch();
              }
            }}
            onChange={(event) => picker.setQuery(event.target.value)}
            placeholder="نام مبحث را بنویسید…"
            value={picker.query}
          />
          <button disabled={picker.invalidated} type="button" onClick={() => void picker.submitSearch()}>جست‌وجو</button>
        </div>
      </div>

      <div className="tri-state-picker__announcer" aria-live="polite">
        {picker.busy ? 'در حال تکمیل ساختار لازم برای انتخاب…' : null}
        {picker.operationError ? <span role="alert">{picker.operationError}</span> : null}
        {picker.operationError && picker.canRetryOperation ? (
          <button type="button" onClick={picker.retryOperation}>تلاش دوباره</button>
        ) : null}
        {picker.limitError ? <span role="alert">تعداد انتخاب‌ها از سقف {picker.limitError.limit.toLocaleString('fa-IR')} مورد بیشتر است.</span> : null}
      </div>

      {picker.search.status !== 'idle' ? (
        <section className="tri-state-picker__results" aria-live="polite">
          <h2>نتایج جست‌وجو</h2>
          {picker.search.status === 'loading' ? <p role="status">در حال جست‌وجو…</p> : null}
          {picker.search.status === 'error' ? <PickerError error={picker.search.error} audience={audience} retry={() => void picker.submitSearch()} /> : null}
          {picker.search.status === 'ready' && picker.search.value.length === 0 ? <p>نتیجه‌ای پیدا نشد.</p> : null}
          {picker.search.status === 'ready' ? picker.search.value.map((result) => (
            <article key={`${result.entryId}:${result.id}`}>
              <div><strong>{result.rawLabel}</strong><small>{presentBreadcrumb(result.breadcrumb)}</small></div>
              <button type="button" onClick={() => picker.revealSearchResult(result)}>نمایش در ساختار</button>
              <TriStateCheckbox
                disabled={picker.busy || picker.invalidated}
                label={`انتخاب ${result.rawLabel}`}
                onChange={() => void picker.toggleNodeSelection(result.id)}
                state={picker.checkboxState(result.id)}
              />
            </article>
          )) : null}
        </section>
      ) : null}

      {picker.catalog.status === 'loading' ? <p className="tri-state-picker__message" role="status">در حال بارگذاری مباحث درسی…</p> : null}
      {picker.catalog.status === 'error' ? <PickerError error={picker.catalog.error} audience={audience} retry={picker.retryCatalog} /> : null}
      {picker.catalog.status === 'ready' && picker.catalog.value.length === 0 ? <p className="tri-state-picker__message">مبحثی برای این رشته ثبت نشده است.</p> : null}
      {picker.catalog.status === 'ready' && picker.catalog.value.length > 0 ? (
        <>
          <nav className="tri-state-picker__subjects" aria-label="درس‌ها و نماهای برنامه درسی">
            {picker.catalog.value.map((entry) => (
              <button
                aria-current={entry.id === picker.activeEntryId ? 'page' : undefined}
                className={entry.id === picker.activeEntryId ? 'is-active' : ''}
                key={entry.id}
                disabled={picker.invalidated}
                onClick={() => picker.setActiveEntryId(entry.id)}
                type="button"
              >{entry.title}</button>
            ))}
          </nav>
          <section className="tri-state-picker__structure" aria-live="polite">
            {picker.roots.status === 'loading' || picker.roots.status === 'idle' ? <p role="status">در حال بارگذاری ساختار…</p> : null}
            {picker.roots.status === 'error' ? (
              <PickerError
                audience={audience}
                error={picker.roots.error}
                retry={() => picker.activeEntryId && picker.setActiveEntryId(picker.activeEntryId)}
              />
            ) : null}
            {picker.roots.status === 'ready' && picker.roots.value.items.length === 0 ? <p>ساختاری برای این درس موجود نیست.</p> : null}
            {picker.roots.status === 'ready' ? picker.roots.value.items.map((item) => (
              <RootItem item={item} key={item.itemKind === 'NODE' ? item.nodeId : item.id} picker={picker} />
            )) : null}
          </section>
        </>
      ) : null}

      <footer className="tri-state-picker__actions">
        <span role="status">{picker.engine?.selection.selectors.length.toLocaleString('fa-IR') ?? '۰'} انتخاب</span>
        <button type="button" onClick={onCancel}>انصراف</button>
        <button
          className="is-primary"
          disabled={!picker.engine || picker.busy || picker.invalidated || (minimumOne && picker.selectedCount === 0)}
          onClick={() => void confirm()}
          type="button"
        >تأیید انتخاب</button>
      </footer>
    </div>
  );
}
