'use client';

import { useEffect, useRef, useState } from 'react';
import type { Contractor, Job } from '@/lib/types';
import type { EmployeeProfile } from '@/lib/employee-profile';
import type { ResolvedCell } from '@/lib/cell-model';
import type { CellPatch } from './MatrixCell';
import { evenAllocation, rebalanceTwoWay } from '@/lib/job-allocation';
import { round2 } from '@/lib/time-utils';
import { NumberField, TimeField } from './SmartFields';

interface CellEditorProps {
  contractor: Contractor;
  workDate: string;
  jobs: Job[];
  profile: EmployeeProfile;
  cell: ResolvedCell;
  anchor: DOMRect;
  onPatch: (patch: CellPatch) => void;
  onClear: () => void;
  onClose: () => void;
}

const W = 300;

export function CellEditor({
  contractor,
  workDate,
  jobs,
  profile,
  cell,
  anchor,
  onPatch,
  onClear,
  onClose,
}: CellEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos] = useState(() => {
    const margin = 8;
    let left = anchor.left;
    if (left + W > window.innerWidth - margin) left = window.innerWidth - W - margin;
    if (left < margin) left = margin;
    const below = anchor.bottom + 6;
    const placeAbove = below + 360 > window.innerHeight && anchor.top > 360;
    const top = placeAbove ? Math.max(margin, anchor.top - 6) : below;
    return { left, top, placeAbove };
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dateLabel = new Date(`${workDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const multiJob = cell.jobSplits.length > 1;

  function addJob() {
    const used = new Set(cell.jobSplits.map((s) => s.jobId));
    const next = jobs.find((j) => !used.has(j.id));
    if (!next) return;
    const ids = [...cell.jobSplits.map((s) => s.jobId), next.id];
    const pcts = evenAllocation(ids.length);
    onPatch({ jobSplits: ids.map((jobId, i) => ({ jobId, allocationPercent: pcts[i] })) });
  }

  function setJobAt(idx: number, jobId: string) {
    onPatch({ jobSplits: cell.jobSplits.map((s, i) => (i === idx ? { ...s, jobId } : s)) });
  }

  function removeJobAt(idx: number) {
    const remaining = cell.jobSplits.filter((_, i) => i !== idx).map((s) => s.jobId);
    const ids = remaining.length ? remaining : [cell.jobSplits[0].jobId];
    const pcts = evenAllocation(ids.length);
    onPatch({ jobSplits: ids.map((jobId, i) => ({ jobId, allocationPercent: pcts[i] })) });
  }

  function setSlider(firstPct: number) {
    const [a, b] = rebalanceTwoWay(firstPct);
    onPatch({
      jobSplits: [
        { ...cell.jobSplits[0], allocationPercent: a },
        { ...cell.jobSplits[1], allocationPercent: b },
      ],
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        style={{ position: 'fixed', left: pos.left, top: pos.top, width: W }}
        className={`z-50 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl ${
          pos.placeAbove ? '-translate-y-full' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <div className="truncate text-sm font-semibold text-slate-900">
            {contractor.displayName}
          </div>
          <div className="text-xs text-slate-500">
            {dateLabel} · {profile.entryMode === 'start_end' ? 'Start–End' : 'Total hours'}
          </div>
        </div>

        {/* Time entry */}
        {profile.entryMode === 'start_end' ? (
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs font-medium text-slate-600">
              Start
              <div className="mt-1">
                <TimeField
                  value={cell.startTime}
                  onCommit={(v) => onPatch({ startTime: v })}
                  ariaLabel="start time"
                />
              </div>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              End
              <div className="mt-1">
                <TimeField
                  value={cell.endTime}
                  placeholder="end"
                  onCommit={(v) => onPatch({ endTime: v })}
                  ariaLabel="end time"
                />
              </div>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Break
              <div className="mt-1">
                <NumberField
                  value={cell.breakMinutes}
                  kind="int"
                  suffix="m"
                  onCommit={(n) => onPatch({ breakMinutes: n })}
                  ariaLabel="break minutes"
                />
              </div>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-slate-600">
              Start
              <div className="mt-1">
                <TimeField
                  value={cell.startTime}
                  onCommit={(v) => onPatch({ startTime: v })}
                  ariaLabel="start time"
                />
              </div>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Hours
              <div className="mt-1">
                <NumberField
                  value={cell.totalHours}
                  placeholder="hrs"
                  suffix="h"
                  onCommit={(n) => onPatch({ totalHours: n })}
                  ariaLabel="total hours"
                />
              </div>
            </label>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5">
          <span className="text-xs text-slate-500">
            {cell.filled ? 'Hours this day' : 'Not entered yet'}
          </span>
          <span className="text-base font-bold tabular-nums text-slate-900">
            {round2(cell.computedHours)}h
          </span>
        </div>

        {/* Jobs */}
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Job allocation</span>
            {cell.jobSplits.length < jobs.length && (
              <button
                type="button"
                onClick={addJob}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                + Add job
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {cell.jobSplits.map((split, idx) => (
              <div key={`${split.jobId}-${idx}`} className="flex items-center gap-1.5">
                <select
                  value={split.jobId}
                  onChange={(e) => setJobAt(idx, e.target.value)}
                  className="min-w-0 flex-1 truncate rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jobNumber}
                      {j.name ? ` · ${j.name}` : ''}
                    </option>
                  ))}
                </select>
                <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-600">
                  {split.allocationPercent}%
                </span>
                {multiJob && (
                  <button
                    type="button"
                    onClick={() => removeJobAt(idx)}
                    className="rounded px-1 text-slate-400 hover:text-red-500"
                    aria-label="Remove job"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {cell.jobSplits.length === 2 && (
            <div className="mt-2.5">
              <input
                type="range"
                min={5}
                max={95}
                value={cell.jobSplits[0]?.allocationPercent ?? 50}
                onChange={(e) => setSlider(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-blue-600"
                aria-label="Job allocation split"
              />
              <div className="mt-1 text-[11px] text-slate-400">drag to fine-tune split</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          {cell.filled && (
            <button
              type="button"
              onClick={() => {
                onClear();
                onClose();
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
