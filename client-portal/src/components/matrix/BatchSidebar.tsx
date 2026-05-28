'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Contractor, EntryMode } from '@/lib/types';
import type { EmployeeProfile } from '@/lib/employee-profile';
import { getEmployeeProfile } from '@/lib/employee-profile';
import type { ProfileState } from '@/lib/payroll-build';
import { TimeField, NumberField } from './SmartFields';

interface BatchSidebarProps {
  contractors: Contractor[];
  profiles: ProfileState;
  selectedEmployees: Set<string>;
  onApplySettings: (patch: Partial<EmployeeProfile>) => void;
}

export function BatchSidebar({
  contractors,
  profiles,
  selectedEmployees,
  onApplySettings,
}: BatchSidebarProps) {
  const selectedList = contractors.filter((c) => selectedEmployees.has(c.id));
  const focus = selectedList.length === 1 ? selectedList[0] : null;
  const count = selectedEmployees.size;

  // settings form state (prefilled from single selection)
  const [mode, setMode] = useState<EntryMode>('start_end');
  const [start, setStart] = useState('07:00');
  const [brk, setBrk] = useState(30);

  useEffect(() => {
    if (focus) {
      const p = getEmployeeProfile(profiles, focus);
      setMode(p.entryMode);
      setStart(p.defaultStartTime);
      setBrk(p.defaultBreakMinutes);
    }
  }, [focus, profiles]);

  const scopeLabel = count === 0 ? 'all employees' : count === 1 ? focus?.displayName : `${count} selected`;

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:w-80">
      {/* SETTINGS */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Employee settings</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Defaults used to pre-fill the editor. Apply to <strong>{scopeLabel}</strong>.
          </p>
        </div>

        <div>
          <span className="mb-1 block text-[11px] font-medium text-slate-600">Time entry method</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setMode('start_end')}
              className={`rounded-md border py-1.5 text-xs font-medium ${
                mode === 'start_end'
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Start + End
            </button>
            <button
              type="button"
              onClick={() => setMode('start_hours')}
              className={`rounded-md border py-1.5 text-xs font-medium ${
                mode === 'start_hours'
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Start + Hours
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-[11px] font-medium text-slate-600">
            Default start
            <div className="mt-1">
              <TimeField value={start} onCommit={setStart} ariaLabel="default start" />
            </div>
          </label>
          <label className="block text-[11px] font-medium text-slate-600">
            Default break
            <div className="mt-1">
              <NumberField value={brk} kind="int" suffix="m" onCommit={setBrk} ariaLabel="default break" />
            </div>
          </label>
        </div>

        <button
          type="button"
          onClick={() =>
            onApplySettings({ entryMode: mode, defaultStartTime: start, defaultBreakMinutes: brk })
          }
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Apply settings to {scopeLabel}
        </button>
        <p className="text-[11px] text-slate-400">
          Tip: click a name to select it, or select several to batch-apply. Per-person defaults can
          also be edited on the Employees page.
        </p>
      </section>

      {/* MANAGE */}
      <section className="space-y-2 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manage</h3>
        <Link
          href="/employees"
          className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <span>Employees</span>
          <span className="text-slate-400">→</span>
        </Link>
        <Link
          href="/jobs"
          className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <span>Job numbers</span>
          <span className="text-slate-400">→</span>
        </Link>
        <p className="text-[11px] text-slate-400">
          Add, edit, or deactivate employees and jobs on their dedicated pages.
        </p>
      </section>
    </aside>
  );
}
