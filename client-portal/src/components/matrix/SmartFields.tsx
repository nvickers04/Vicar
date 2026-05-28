'use client';

import { useEffect, useState } from 'react';
import { fmtTime, parseHoursInput, parseTimeInput } from '@/lib/time-utils';

const base =
  'w-full rounded-md border px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400';

/** Free-text time entry: type "730", "7:30a", "15:30", "3p". Commits on blur / Enter. */
export function TimeField({
  value,
  placeholder,
  onCommit,
  ariaLabel,
}: {
  value: string;
  placeholder?: string;
  onCommit: (hhmm: string) => void;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(value ? fmtTime(value) : '');
  const [editing, setEditing] = useState(false);
  const [bad, setBad] = useState(false);

  useEffect(() => {
    if (!editing) setText(value ? fmtTime(value) : '');
  }, [value, editing]);

  function commit() {
    setEditing(false);
    if (text.trim() === '') return; // leave empty as-is
    const parsed = parseTimeInput(text);
    if (parsed) {
      setBad(false);
      onCommit(parsed);
      setText(fmtTime(parsed));
    } else {
      setBad(true);
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      value={text}
      placeholder={placeholder ?? '—'}
      onFocus={(e) => {
        setEditing(true);
        e.currentTarget.select();
      }}
      onChange={(e) => {
        setText(e.target.value);
        setBad(false);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setText(value ? fmtTime(value) : '');
          setEditing(false);
          e.currentTarget.blur();
        }
      }}
      className={`${base} ${bad ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
    />
  );
}

/** Free-text numeric entry (hours / minutes). Commits on blur / Enter. */
export function NumberField({
  value,
  placeholder,
  suffix,
  kind = 'hours',
  onCommit,
  ariaLabel,
}: {
  value: number | undefined;
  placeholder?: string;
  suffix?: string;
  kind?: 'hours' | 'int';
  onCommit: (n: number) => void;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(value != null ? String(value) : '');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(value != null ? String(value) : '');
  }, [value, editing]);

  function commit() {
    setEditing(false);
    if (text.trim() === '') return;
    const parsed =
      kind === 'int' ? Math.round(Number(text.replace(/[^0-9]/g, ''))) : parseHoursInput(text);
    if (parsed != null && !Number.isNaN(parsed)) {
      onCommit(parsed);
      setText(String(parsed));
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={text}
        placeholder={placeholder ?? '—'}
        onFocus={(e) => {
          setEditing(true);
          e.currentTarget.select();
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className={`${base} border-slate-300 ${suffix ? 'pr-7' : ''}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
}
