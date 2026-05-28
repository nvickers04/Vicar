'use client';

import { formatWeekLabel } from '@/lib/time-utils';
import { shiftWeek } from '@/lib/week-utils';

interface MatrixToolbarProps {
  monday: Date;
  weekStart: string;
  weekEnd: string;
  targetCellCount: number;
  submitting: boolean;
  onWeekChange: (monday: Date) => void;
  onSubmit: () => void;
}

export function MatrixToolbar({
  monday,
  weekStart,
  weekEnd,
  targetCellCount,
  submitting,
  onWeekChange,
  onSubmit,
}: MatrixToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Week of</span>
        <button
          type="button"
          onClick={() => onWeekChange(shiftWeek(monday, -1))}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          aria-label="Previous week"
        >
          ←
        </button>
        <span className="min-w-[170px] text-center text-sm font-semibold tabular-nums text-slate-900">
          {formatWeekLabel(weekStart, weekEnd)}
        </span>
        <button
          type="button"
          onClick={() => onWeekChange(shiftWeek(monday, 1))}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          aria-label="Next week"
        >
          →
        </button>
        <button
          type="button"
          onClick={() => onWeekChange(new Date())}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          Today
        </button>
      </div>

      <div className="flex items-center gap-3">
        {targetCellCount > 0 && (
          <span className="text-xs text-slate-500">
            {targetCellCount} cell{targetCellCount === 1 ? '' : 's'} selected
          </span>
        )}
        <button
          type="button"
          disabled={submitting}
          onClick={onSubmit}
          className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit week'}
        </button>
      </div>
    </div>
  );
}
