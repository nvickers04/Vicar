'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import {
  clearOverride,
  getOverride,
  getTargetCells,
  resolveCell,
  setJobSplitsOverride,
  setOverride,
  type CellOverride,
  type OverrideState,
} from '@/lib/cell-model';
import { getEmployeeProfile, profileFromContractor, type EmployeeProfile } from '@/lib/employee-profile';
import type { Contractor, Job } from '@/lib/types';
import { buildPayrollEntries, jobTotals, type ProfileState, weekTotalHours } from '@/lib/payroll-build';
import { round2 } from '@/lib/time-utils';
import { mondayOfWeek, weekDates } from '@/lib/week-utils';
import type { CellPatch } from './MatrixCell';
import { BatchActionBar } from './BatchActionBar';
import { BatchSidebar } from './BatchSidebar';
import { CellEditor } from './CellEditor';
import { MatrixGrid } from './MatrixGrid';
import { MatrixToolbar } from './MatrixToolbar';
import { TotalsPanel } from './TotalsPanel';

export function MatrixTimesheet() {
  const router = useRouter();
  const [monday, setMonday] = useState(() => mondayOfWeek());
  const dates = useMemo(() => weekDates(monday), [monday]);
  const weekStart = dates[0];
  const weekEnd = dates[6];

  const [jobs, setJobs] = useState<Job[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [overrides, setOverrides] = useState<OverrideState>({});
  const [profiles, setProfiles] = useState<ProfileState>({});
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [openCell, setOpenCell] = useState<{
    contractorId: string;
    date: string;
    anchor: DOMRect;
  } | null>(null);
  const openCellRef = useRef(openCell);
  openCellRef.current = openCell;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const defaultJobId = jobs[0]?.id ?? '';
  const targetCells = getTargetCells(contractors, dates, selectedEmployees, selectedDates);
  const hasSelection = selectedEmployees.size > 0 || selectedDates.size > 0;

  useEffect(() => {
    Promise.all([api.jobs(), api.contractors()])
      .then(([j, c]) => {
        const active = c.filter((x) => (x.status ?? 'active') === 'active');
        setJobs(j);
        setContractors(active);
        setProfiles(Object.fromEntries(active.map((x) => [x.id, profileFromContractor(x)])));
      })
      .catch((err: ApiError) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (openCellRef.current) setOpenCell(null);
      else {
        setSelectedEmployees(new Set());
        setSelectedDates(new Set());
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function patchCell(contractorId: string, date: string, patch: CellPatch) {
    setOverrides((prev) => setOverride(prev, contractorId, date, patch));
  }

  function applyToTargets(patch: CellOverride) {
    setOverrides((prev) => {
      let next = prev;
      for (const { contractorId, date } of targetCells) {
        next = setOverride(next, contractorId, date, patch);
      }
      return next;
    });
  }

  function clearTargets() {
    setOverrides((prev) => {
      let next = prev;
      for (const { contractorId, date } of targetCells) {
        next = clearOverride(next, contractorId, date);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedEmployees(new Set());
    setSelectedDates(new Set());
  }

  // ---- Employee settings (apply to selected, or all if none selected) ----
  function applySettings(patch: Partial<EmployeeProfile>) {
    const ids = selectedEmployees.size > 0 ? [...selectedEmployees] : contractors.map((c) => c.id);
    setProfiles((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        const c = contractors.find((x) => x.id === id);
        if (c) next[id] = { ...getEmployeeProfile(next, c), ...patch };
      }
      return next;
    });
    // persist defaults to backend (fire and forget)
    for (const id of ids) {
      api
        .updateContractor(id, {
          timeDefaults: {
            ...(patch.entryMode ? { defaultEntryMode: patch.entryMode } : {}),
            ...(patch.defaultStartTime ? { defaultStartTime: patch.defaultStartTime } : {}),
            ...(patch.defaultBreakMinutes != null
              ? { defaultBreakMinutes: patch.defaultBreakMinutes }
              : {}),
          },
        })
        .catch(() => {});
    }
    setSuccess(`Settings applied to ${ids.length} employee${ids.length === 1 ? '' : 's'}.`);
    setTimeout(() => setSuccess(''), 2500);
  }

  async function submitWeek() {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const entries = buildPayrollEntries(contractors, jobs, overrides, profiles, dates);
      if (entries.length === 0) {
        setError('No hours entered yet. Click a cell (or use the batch bar) before submitting.');
        return;
      }
      await api.runPayroll({ periodStart: weekStart, periodEnd: weekEnd, entries });
      setSuccess('Week submitted successfully.');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  const weekTotals = Object.fromEntries(
    contractors.map((c) => [c.id, weekTotalHours(c, dates, overrides, profiles, defaultJobId)]),
  );
  const entries = buildPayrollEntries(contractors, jobs, overrides, profiles, dates);
  const totals = jobTotals(entries);
  const workingCount = Object.values(weekTotals).filter((h) => h > 0).length;

  const openContractor = openCell
    ? contractors.find((c) => c.id === openCell.contractorId)
    : undefined;
  const openProfile = openContractor ? getEmployeeProfile(profiles, openContractor) : undefined;
  const openResolved =
    openCell && openProfile
      ? resolveCell(openProfile, getOverride(overrides, openCell.contractorId, openCell.date), defaultJobId)
      : undefined;

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-500">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <MatrixToolbar
        monday={monday}
        weekStart={weekStart}
        weekEnd={weekEnd}
        targetCellCount={targetCells.length}
        submitting={submitting}
        onWeekChange={setMonday}
        onSubmit={submitWeek}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700" role="status">
          {success}
        </p>
      )}

      {hasSelection && (
        <BatchActionBar
          targetCount={targetCells.length}
          employeeCount={selectedEmployees.size}
          dayCount={selectedDates.size}
          jobs={jobs}
          onApplyStart={(start) => applyToTargets({ startTime: start })}
          onApplyEnd={(end) => applyToTargets({ endTime: end })}
          onApplyHours={(hours) => applyToTargets({ totalHours: hours })}
          onApplyBreak={(minutes) => applyToTargets({ breakMinutes: minutes })}
          onApplyJobs={(jobIds) => applyToTargets({ jobSplits: setJobSplitsOverride(jobIds) })}
          onClearEntries={clearTargets}
          onClearSelection={clearSelection}
        />
      )}

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <MatrixGrid
            contractors={contractors}
            dates={dates}
            jobs={jobs}
            overrides={overrides}
            profiles={profiles}
            selectedEmployees={selectedEmployees}
            selectedDates={selectedDates}
            onToggleEmployee={(id) =>
              setSelectedEmployees((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            onToggleDate={(date) =>
              setSelectedDates((prev) => {
                const next = new Set(prev);
                if (next.has(date)) next.delete(date);
                else next.add(date);
                return next;
              })
            }
            onSelectAllEmployees={(checked) =>
              setSelectedEmployees(checked ? new Set(contractors.map((c) => c.id)) : new Set())
            }
            openCell={openCell ? { contractorId: openCell.contractorId, date: openCell.date } : null}
            onOpenCell={(contractorId, date, anchor) => setOpenCell({ contractorId, date, anchor })}
            weekTotals={weekTotals}
          />

          <TotalsPanel
            jobs={jobs}
            totals={totals}
            workingCount={workingCount}
            employeeCount={contractors.length}
          />
        </div>

        <BatchSidebar
          contractors={contractors}
          profiles={profiles}
          selectedEmployees={selectedEmployees}
          onApplySettings={applySettings}
        />
      </div>

      {openCell && openContractor && openProfile && openResolved && (
        <CellEditor
          contractor={openContractor}
          workDate={openCell.date}
          jobs={jobs}
          profile={openProfile}
          cell={openResolved}
          anchor={openCell.anchor}
          onPatch={(patch) => patchCell(openCell.contractorId, openCell.date, patch)}
          onClear={() => setOverrides((prev) => clearOverride(prev, openCell.contractorId, openCell.date))}
          onClose={() => setOpenCell(null)}
        />
      )}
    </div>
  );
}
