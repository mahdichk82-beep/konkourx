import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { TriStateCurriculumPicker } from './TriStateCurriculumPicker.tsx';
import {
  createEmptyPlanningCurriculumValue,
  type PlanningCurriculumValue,
} from './planning.ts';
import type { CurriculumBrowserClient } from './types.ts';
import type { CurriculumAudience } from './view-model.ts';

export type PlanningCurriculumFieldProps = {
  audience: CurriculumAudience;
  client: CurriculumBrowserClient;
  contextLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  minimumOne?: boolean;
  onChange(value: PlanningCurriculumValue): void;
  value: PlanningCurriculumValue;
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
  const [draftInitial, setDraftInitial] = useState<Extract<PlanningCurriculumValue, { kind: 'V2' }> | null>(null);
  const [replacingHistorical, setReplacingHistorical] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const replacementTriggerRef = useRef<HTMLButtonElement>(null);
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
      (replacingHistorical ? replacementTriggerRef : triggerRef).current?.focus();
    };
  }, [open, replacingHistorical]);

  const beginEditing = () => {
    if (value.kind !== 'V2') return;
    setReplacingHistorical(false);
    setDraftInitial(value);
    setOpen(true);
  };

  const beginHistoricalReplacement = () => {
    setReplacingHistorical(true);
    setDraftInitial(createEmptyPlanningCurriculumValue());
    setOpen(true);
  };

  const summaries = value.kind === 'V2'
    ? value.summaries.map((summary) => ({
        key: `${summary.rootKind}:${summary.rootId}`,
        label: summary.label,
        path: summary.path,
      }))
    : value.snapshots.map((snapshot, index) => ({
        key: `historical:${snapshot.curriculumRefId}:${index}`,
        label: snapshot.labelSnapshot,
        path: snapshot.pathSnapshot,
      }));

  const pickerModal = open && draftInitial ? createPortal(
    <div className="planning-curriculum-modal" role="presentation">
      <div aria-hidden="true" className="planning-curriculum-modal__backdrop" />
      <section
        aria-label="انتخاب مباحث درسی"
        aria-modal="true"
        className="planning-curriculum-modal__panel"
        ref={panelRef}
        role="dialog"
      >
        <div className="planning-curriculum-modal__body">
          <TriStateCurriculumPicker
            audience={audience}
            client={client}
            contextLabel={contextLabel}
            initialValue={draftInitial}
            minimumOne={minimumOne}
            onCancel={() => setOpen(false)}
            onConfirm={(next) => {
              onChange(next);
              setOpen(false);
            }}
            replacementNotice={replacingHistorical
              ? 'با تأیید، مباحث جدید جایگزین همه مباحث ذخیره‌شده قبلی می‌شوند.'
              : undefined}
          />
        </div>
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <section className="planning-curriculum-field" aria-label="مباحث درسی">
      <div className="planning-curriculum-field__heading">
        <div>
          <strong>مباحث درسی</strong>
          <small>انتخاب از ساختار رسمی برنامه درسی</small>
        </div>
        {value.kind === 'V2' ? (
          <button disabled={disabled} onClick={beginEditing} ref={triggerRef} type="button">
            {summaries.length > 0 ? 'ویرایش مباحث' : 'انتخاب مبحث'}
          </button>
        ) : null}
      </div>

      {disabled && disabledReason ? <p className="planning-curriculum-field__notice">{disabledReason}</p> : null}
      {summaries.length === 0 ? (
        <p className="planning-curriculum-field__empty">هنوز مبحث رسمی برای این کار انتخاب نشده است.</p>
      ) : (
        <ol className="planning-curriculum-field__targets">
          {summaries.map((summary) => (
            <li className={value.kind === 'PRESERVED_HISTORICAL' ? 'is-legacy' : undefined} key={summary.key}>
              <div>
                <strong>{summary.label}</strong>
                <small>{summary.path.join(' ← ')}</small>
              </div>
              {value.kind === 'PRESERVED_HISTORICAL' ? <span>انتخاب ذخیره‌شده · فقط خواندنی</span> : null}
            </li>
          ))}
        </ol>
      )}

      {value.kind === 'PRESERVED_HISTORICAL' && !disabled ? (
        <div className="planning-curriculum-field__historical-action">
          <p>این انتخاب تاریخی بدون تغییر حفظ می‌شود. تأیید انتخاب تازه، کل مجموعه ذخیره‌شده را جایگزین می‌کند.</p>
          <button onClick={beginHistoricalReplacement} ref={replacementTriggerRef} type="button">انتخاب مباحث جدید</button>
        </div>
      ) : null}

      {pickerModal}
    </section>
  );
}
