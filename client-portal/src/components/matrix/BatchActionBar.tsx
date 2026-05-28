'use client';

import { useState } from 'react';
import type { Job } from '@/lib/types';
import { NumberField, TimeField } from './SmartFields';

interface BatchActionBarProps {
  targetCount: number;
  employeeCount: number;
  dayCount: number;
  jobs: Job[];
  onApplyStart: (start: string) => void;
  onApplyEnd: (end: string) => void;
  onApplyHours: (hours: number) => void;
  onApplyBreak: (minutes: number) => void;
  onApplyJobs: (jobIds: string[]) => void;
  onClearEntries: () => void;
  onClearSelection: () => void;
}

export function BatchActionBar({
  targetCount,
  employeeCount,
  dayCount,
  jobs,
  onApplyStart,
  onApplyEnd,
  onApplyHours,
  onApplyBreak,
  onApplyJobs,
  onClearEntries,
  onClearSelection,
}: BatchActionBarProps) {
  const [start, setStart] = useState('07:00');
  const [end, setEnd] = useState('15:30');
  const [hours, setHours] = useState(8);
  const [brk, setBrk] = useState(30);
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [jobsOpen, setJobsOpen] = useState(false);

  function toggleJob(id: string) {
    setJobIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const scope =
    `${employeeCount || 'all'} employee${employeeCount === 1 ? '' : 's'}` +
    ` × ${dayCount || 'all'} day${dayCount === 1 ? '' : 's'}`;

  const setBtn =
    'rounded bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50';

  return (
    <div className="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/95 px-3 py-2 shadow-sm backdrop-blur">
      <span className="text-xs font-semibold text-blue-900">
        {targetCount} cell{targetCount === 1 ? '' : 's'}
        <span className="font-normal text-blue-700"> · {scope}</span>
      </span>

      <span className="hidden h-5 w-px bg-blue-200 sm:block" />

      <div className="flex items-center gap-1">
        <div className="w-[68px]">
          <TimeField value={start} onCommit={setStart} ariaLabel="batch start" />
        </div>
        <button type="button" onClick={() => onApplyStart(start)} className={setBtn}>
          Set start
        </button>
      </div>

      <div className="flex items-center gap-1">
        <div className="w-[68px]">
          <TimeField value={end} onCommit={setEnd} ariaLabel="batch end" />
        </div>
        <button type="button" onClick={() => onApplyEnd(end)} className={setBtn}>
          Set end
        </button>
      </div>

      <div className="flex items-center gap-1">
        <div className="w-[60px]">
          <NumberField value={hours} suffix="h" onCommit={setHours} ariaLabel="batch hours" />
        </div>
        <button type="button" onClick={() => onApplyHours(hours)} className={setBtn}>
          Set hrs
        </button>
      </div>

      <div className="flex items-center gap-1">
        <div className="w-[56px]">
          <NumberField value={brk} kind="int" suffix="m" onCommit={setBrk} ariaLabel="batch break" />
        </div>
        <button type="button" onClick={() => onApplyBreak(brk)} className={setBtn}>
          Set break
        </button>
      </div>

      {/* Jobs popover */}
      <div className="relative">
        <button type="button" onClick={() => setJobsOpen((o) => !o)} className={setBtn}>
          Jobs{jobIds.length ? ` (${jobIds.length})` : ''} ▾
        </button>
        {jobsOpen && (
          <div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <p className="mb-1 px-1 text-[10px] text-slate-500">Even split across selected days</p>
            <div className="max-h-44 space-y-0.5 overflow-auto">
              {jobs.map((j) => (
                <label
                  key={j.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={jobIds.includes(j.id)}
                    onChange={() => toggleJob(j.id)}
                    className="size-3.5 rounded border-slate-400"
                  />
                  <span className="font-mono text-slate-700">{j.jobNumber}</span>
                  {j.name && <span className="truncate text-slate-400">{j.name}</span>}
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={jobIds.length === 0}
              onClick={() => {
                onApplyJobs(jobIds);
                setJobsOpen(false);
              }}
              className="mt-2 w-full rounded bg-blue-600 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Apply to selected cells
            </button>
          </div>
        )}
      </div>

      <span className="hidden h-5 w-px bg-blue-200 sm:block" />

      <button type="button" onClick={onClearEntries} className={setBtn}>
        Clear cells
      </button>
      <button
        type="button"
        onClick={onClearSelection}
        className="ml-auto rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
      >
        Done
      </button>
    </div>
  );
}
