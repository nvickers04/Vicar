'use client';

import type { Job } from '@/lib/types';
import type { EmployeeProfile } from '@/lib/employee-profile';
import type { ResolvedCell } from '@/lib/cell-model';
import { fmtTime, round2 } from '@/lib/time-utils';

export interface CellPatch {
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  breakMinutes?: number;
  jobSplits?: { jobId: string; allocationPercent: number }[];
}

interface MatrixCellProps {
  jobs: Job[];
  profile: EmployeeProfile;
  cell: ResolvedCell;
  isHighlighted: boolean;
  isWeekendDay: boolean;
  isOpen: boolean;
  onOpen: (rect: DOMRect) => void;
}

export function MatrixCell({
  jobs,
  profile,
  cell,
  isHighlighted,
  isWeekendDay,
  isOpen,
  onOpen,
}: MatrixCellProps) {
  const primaryJob = jobs.find((j) => j.id === cell.jobSplits[0]?.jobId);
  const multiJob = cell.jobSplits.length > 1;

  const bg = isOpen
    ? 'bg-blue-50 ring-2 ring-inset ring-blue-500'
    : isHighlighted
      ? 'bg-amber-50'
      : isWeekendDay
        ? 'bg-slate-50/60'
        : 'bg-white hover:bg-slate-50';

  return (
    <td className={`h-[58px] cursor-pointer border border-slate-200 px-2 transition-colors ${bg}`}>
      <button
        type="button"
        onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
        className="group flex h-full w-full flex-col justify-center gap-0.5 text-left"
      >
        {!cell.filled ? (
          <span className="text-center text-base font-light text-slate-300 group-hover:text-blue-400">
            +
          </span>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-[17px] font-bold leading-none tabular-nums text-slate-900">
                {round2(cell.computedHours)}
              </span>
              <span className="text-[11px] text-slate-400">h</span>
            </div>
            <div className="truncate text-[11px] leading-none text-slate-400">
              {profile.entryMode === 'start_end'
                ? `${fmtTime(cell.startTime)}–${fmtTime(cell.endTime)}`
                : `${fmtTime(cell.startTime)} start`}
            </div>
            <div className="flex items-center gap-1 truncate text-[11px] leading-none">
              <span className="truncate font-mono text-slate-500">
                {primaryJob?.jobNumber ?? '—'}
              </span>
              {multiJob && (
                <span className="rounded bg-blue-100 px-1 text-[9px] font-semibold text-blue-700">
                  +{cell.jobSplits.length - 1}
                </span>
              )}
            </div>
          </>
        )}
      </button>
    </td>
  );
}
