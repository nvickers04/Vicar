import { getEmployeeProfile, type EmployeeProfile } from './employee-profile';
import { getOverride, resolveCell, type OverrideState } from './cell-model';
import type { Contractor, Job } from './types';
import { applyDailyOtRule, applyWeeklyOt, round2, splitHoursByAllocation } from './time-utils';

export type ProfileState = Record<string, EmployeeProfile>;

export interface PayrollEntry {
  jobId: string;
  contractorId: string;
  workDate: string;
  stHours: number;
  otHours: number;
  payRate?: number;
}

export function buildPayrollEntries(
  contractors: Contractor[],
  jobs: Job[],
  overrides: OverrideState,
  profiles: ProfileState,
  dates: string[],
): PayrollEntry[] {
  const defaultJobId = jobs[0]?.id ?? '';
  let entries: PayrollEntry[] = [];

  for (const contractor of contractors) {
    const profile = getEmployeeProfile(profiles, contractor);

    for (const date of dates) {
      const override = getOverride(overrides, contractor.id, date);
      const cell = resolveCell(profile, override, defaultJobId);
      if (!cell.filled || cell.computedHours <= 0) continue;

      const { stHours, otHours } = applyDailyOtRule(cell.computedHours, profile.otRule);
      const shares = splitHoursByAllocation(
        stHours,
        otHours,
        cell.jobSplits.map((s) => s.allocationPercent),
      );

      cell.jobSplits.forEach((split, i) => {
        const share = shares[i];
        if (!share || (share.stHours === 0 && share.otHours === 0)) return;
        if (!jobs.some((j) => j.id === split.jobId)) return;

        entries.push({
          jobId: split.jobId,
          contractorId: contractor.id,
          workDate: date,
          stHours: share.stHours,
          otHours: share.otHours,
          payRate: contractor.defaultPayRate,
        });
      });
    }

    if (profile.otRule === 'weekly_40') {
      entries = applyWeeklyOt(entries, contractor.id);
    }
  }

  return entries;
}

export function weekTotalHours(
  contractor: Contractor,
  dates: string[],
  overrides: OverrideState,
  profiles: ProfileState,
  defaultJobId: string,
): number {
  const profile = getEmployeeProfile(profiles, contractor);
  let total = 0;
  for (const date of dates) {
    const cell = resolveCell(profile, getOverride(overrides, contractor.id, date), defaultJobId);
    total += cell.computedHours;
  }
  return round2(total);
}

export interface JobTotal {
  jobId: string;
  stHours: number;
  otHours: number;
}

/** Aggregate the week's entries by job into ST / OT hour totals. */
export function jobTotals(entries: PayrollEntry[]): JobTotal[] {
  const map = new Map<string, JobTotal>();
  for (const e of entries) {
    const t = map.get(e.jobId) ?? { jobId: e.jobId, stHours: 0, otHours: 0 };
    t.stHours = round2(t.stHours + e.stHours);
    t.otHours = round2(t.otHours + e.otHours);
    map.set(e.jobId, t);
  }
  return [...map.values()];
}
