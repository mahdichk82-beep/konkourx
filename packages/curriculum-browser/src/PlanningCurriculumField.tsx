import { useEffect, useRef, useState } from 'react';

import { CurriculumBrowser } from './CurriculumBrowser.tsx';
import {
  mergePlanningSelections,
  resolvedSelections,
  type PlanningTargetDraftItem,
} from './planning.ts';
import type { CurriculumBrowserClient, CurriculumSelection } from './types.ts';
import { presentBreadcrumb, type CurriculumAudience } from './view-model.ts';

export type PlanningCurriculumFieldProps = {
  audience: CurriculumAudience;
  client: CurriculumBrowserClient;
  contextLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  minimumOne?: boolean;
  onChange(value: readonly PlanningTargetDraftItem[]): void;
  value: readonly PlanningTargetDraftItem[];
};

export function PlanningCurriculumField({
  audience,
  client,
  contextLabel,
  disabled = false,
  disabledReason,
  minimumOne = false,
  onChange,
  value,
}: PlanningCurriculumFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<readonly CurriculumSelection[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('input, button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  const beginEditing = () => {
    setDraft(resolvedSelections(value));
    setOpen(true);
  };

  const confirm = () => {
    onChange(mergePlanningSelections(value, draft));
    setOpen(false);
  };

  return (
    <section className="planning-curriculum-field" aria-label="مباحث درسی">
      <div className="planning-curriculum-field__heading">
        <div>
          <strong>مباحث درسی</strong>
          <small>انتخاب از ساختار رسمی برنامه درسی</small>
        </div>
        <button disabled={disabled} onClick={beginEditing} ref={triggerRef} type="button">
          {value.length > 0 ? 'ویرایش مباحث' : 'انتخاب مبحث'}
        </button>
      </div>

      {disabled && disabledReason ? <p className="planning-curriculum-field__notice">{disabledReason}</p> : null}
      {value.length === 0 ? (
        <p className="planning-curriculum-field__empty">هنوز مبحث رسمی برای این کار انتخاب نشده است.</p>
      ) : (
        <ol className="planning-curriculum-field__targets">
          {value.map((item, index) => {
            if (item.kind === 'NODE') {
              return (
                <li key={`node:${item.selection.entryId}:${item.selection.nodeId}`}>
                  <div>
                    <strong>{item.selection.label}</strong>
                    <small>{item.displayPath.join(' ← ') || presentBreadcrumb(item.selection.breadcrumb)}</small>
                    {item.selection.mode === 'WHOLE' ? <small>انتخاب تاریخی با دامنه ذخیره‌شده</small> : null}
                  </div>
                  {!disabled && (!minimumOne || value.length > 1) ? <button aria-label={`حذف ${item.selection.label}`} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} type="button">حذف</button> : null}
                </li>
              );
            }
            const legacy = item.kind === 'PLACEMENT';
            const unresolved = item.kind === 'UNRESOLVED_NODE';
            return (
              <li className="is-legacy" key={`${item.kind}:${item.target.curriculumRefId}:${index}`}>
                <div>
                  <strong>{item.target.labelSnapshot}</strong>
                  <small>{item.target.pathSnapshot.join(' ← ')}</small>
                </div>
                <span>{legacy ? 'هدف قدیمی · فقط خواندنی' : unresolved ? 'مبحث تاریخی · فقط خواندنی' : null}</span>
              </li>
            );
          })}
        </ol>
      )}

      {open ? (
        <div className="planning-curriculum-modal" role="presentation">
          <button aria-label="بستن انتخاب مباحث" className="planning-curriculum-modal__backdrop" onClick={() => setOpen(false)} type="button" />
          <section aria-label="انتخاب مباحث درسی" aria-modal="true" className="planning-curriculum-modal__panel" ref={panelRef} role="dialog">
            <div className="planning-curriculum-modal__body">
              <CurriculumBrowser
                audience={audience}
                client={client}
                contextLabel={contextLabel}
                mode="PICKER"
                onSelectedNodesChange={setDraft}
                selectedNodes={draft}
              />
            </div>
            <footer className="planning-curriculum-modal__actions">
              <span role="status">{draft.length.toLocaleString('fa-IR')} مبحث انتخاب شده</span>
              <button onClick={() => setOpen(false)} type="button">انصراف</button>
              <button className="is-primary" disabled={minimumOne && draft.length === 0} onClick={confirm} type="button">تأیید انتخاب</button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
