'use client';

import { getEmployeeProfile } from '@/lib/employee-profile';
import { getOverride, isCellSelected, resolveCell, type OverrideState } from '@/lib/cell-model';
import type { Contractor, Job } from '@/lib/types';
import type { ProfileState } from '@/lib/payroll-build';
import { dayShort, isToday, isWeekend } from '@/lib/week-utils';
import { MatrixCell } from './MatrixCell';

interface MatrixGridProps {
  contractors: Contractor[];
  dates: string[];
  jobs: Job[];
  overrides: OverrideState;
  profiles: ProfileState;
  selectedEmployees: Set<string>;
  selectedDates: Set<string>;
  openCell: { contractorId: string; date: string } | null;
  onToggleEmployee: (id: string) => void;
  onToggleDate: (date: string) => void;
  onSelectAllEmployees: (checked: boolean) => void;
  onOpenCell: (contractorId: string, date: string, rect: DOMRect) => void;
  weekTotals: Record<string, number>;
}

export function MatrixGrid({
  contractors,
  dates,
  jobs,
  overrides,
  profiles,
  selectedEmployees,
  selectedDates,
  openCell,
  onToggleEmployee,
  onToggleDate,
  onSelectAllEmployees,
  onOpenCell,
  weekTotals,
}: MatrixGridProps) {
  const defaultJobId = jobs[0]?.id ?? '';
  const allEmployeesSelected =
    contractors.length > 0 && contractors.every((c) => selectedEmployees.has(c.id));

  return (
    <div className="overflow-auto rounded-xl border border-slate-300 bg-white shadow-sm">
      <table className="w-full min-w-[1040px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 min-w-[220px] border-b border-r border-slate-300 bg-slate-50 px-3 py-2.5 text-left">
              <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <input
                  type="checkbox"
                  checked={allEmployeesSelected}
                  onChange={(e) => onSelectAllEmployees(e.target.checked)}
                  className="size-3.5 rounded border-slate-400"
                />
                Employee
              </label>
            </th>
            {dates.map((date) => {
              const weekend = isWeekend(date);
              const today = isToday(date);
              const selected = selectedDates.has(date);
              return (
                <th
                  key={date}
                  className={`min-w-[124px] border-b border-r border-slate-300 px-1 py-1.5 text-center ${
                    selected ? 'bg-amber-100' : weekend ? 'bg-slate-100' : 'bg-slate-50'
                  }`}
                >
                  <label className="flex cursor-pointer flex-col items-center gap-0.5">
                    <span
                      className={`text-[12px] font-bold uppercase ${
                        weekend ? 'text-slate-400' : 'text-slate-700'
                      }`}
                    >
                      {dayShort(date)}
                    </span>
                    <span
                      className={`text-[10px] tabular-nums ${
                        today
                          ? 'rounded-full bg-blue-600 px-1.5 font-semibold text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleDate(date)}
                      className="size-3.5 rounded border-slate-400"
                    />
                  </label>
                </th>
              );
            })}
            <th className="min-w-[60px] border-b border-slate-300 bg-slate-50 px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Week
            </th>
          </tr>
        </thead>
        <tbody>
          {contractors.map((contractor) => {
            const profile = getEmployeeProfile(profiles, contractor);
            const rowSelected = selectedEmployees.has(contractor.id);

            return (
              <tr key={contractor.id} className="group/row">
                <td
                  className={`sticky left-0 z-10 border-b border-r border-slate-200 px-3 py-2 ${
                    rowSelected ? 'bg-blue-50' : 'bg-white group-hover/row:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rowSelected}
                      onChange={() => onToggleEmployee(contractor.id)}
                      className="size-3.5 rounded border-slate-400"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-slate-900">
                        {contractor.displayName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {profile.entryMode === 'start_end' ? 'Start–End' : 'Total hours'}
                      </div>
                    </div>
                  </div>
                </td>
                {dates.map((date) => {
                  const override = getOverride(overrides, contractor.id, date);
                  const weekend = isWeekend(date);
                  const cell = resolveCell(profile, override, defaultJobId);
                  const isHighlighted = isCellSelected(
                    contractor.id,
                    date,
                    selectedEmployees,
                    selectedDates,
                  );
                  const isOpen =
                    openCell?.contractorId === contractor.id && openCell.date === date;

                  return (
                    <MatrixCell
                      key={date}
                      jobs={jobs}
                      profile={profile}
                      cell={cell}
                      isHighlighted={isHighlighted}
                      isWeekendDay={weekend}
                      isOpen={isOpen}
                      onOpen={(rect) => onOpenCell(contractor.id, date, rect)}
                    />
                  );
                })}
                <td className="border-b border-slate-200 bg-slate-50 px-2 text-center text-[14px] font-bold tabular-nums text-slate-800">
                  {weekTotals[contractor.id]?.toFixed(1) ?? '0'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
