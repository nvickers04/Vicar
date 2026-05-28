import type { EmployeeProfile } from './employee-profile';
import type { Contractor, JobSplitOverride } from './types';
import { evenAllocation } from './job-allocation';
import { startEndToHours, round2 } from './time-utils';

/**
 * A cell entry. Cells are EMPTY until the user enters data here.
 * Start time / break fall back to the employee profile only for convenience
 * while editing — a cell is not counted until it has an end time (start_end)
 * or total hours (start_hours).
 */
export interface CellOverride {
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  breakMinutes?: number;
  jobSplits?: JobSplitOverride[];
}

export type OverrideState = Record<string, Record<string, CellOverride>>;

export interface ResolvedCell {
  startTime: string;
  endTime: string;
  totalHours: number | undefined;
  breakMinutes: number;
  jobSplits: JobSplitOverride[];
  computedHours: number;
  /** True once the cell has enough data to count as a worked day. */
  filled: boolean;
}

export function resolveCell(
  profile: EmployeeProfile,
  override: CellOverride | undefined,
  defaultJobId: string,
): ResolvedCell {
  const startTime = override?.startTime ?? profile.defaultStartTime;
  const endTime = override?.endTime ?? '';
  const totalHours = override?.totalHours;
  const breakMinutes = override?.breakMinutes ?? profile.defaultBreakMinutes;

  const filled =
    profile.entryMode === 'start_end'
      ? Boolean(override?.endTime)
      : totalHours != null && totalHours > 0;

  const computedHours = !filled
    ? 0
    : profile.entryMode === 'start_end'
      ? startEndToHours(startTime, endTime, breakMinutes)
      : (totalHours ?? 0);

  const jobSplits =
    override?.jobSplits && override.jobSplits.length > 0
      ? override.jobSplits
      : [{ jobId: defaultJobId, allocationPercent: 100 }];

  return {
    startTime,
    endTime,
    totalHours,
    breakMinutes,
    jobSplits,
    computedHours: round2(computedHours),
    filled,
  };
}

export function getOverride(
  state: OverrideState,
  contractorId: string,
  date: string,
): CellOverride | undefined {
  return state[contractorId]?.[date];
}

export function setOverride(
  state: OverrideState,
  contractorId: string,
  date: string,
  patch: CellOverride,
): OverrideState {
  const prev = state[contractorId]?.[date] ?? {};
  const merged = { ...prev, ...patch };
  return {
    ...state,
    [contractorId]: { ...(state[contractorId] ?? {}), [date]: merged },
  };
}

export function clearOverride(
  state: OverrideState,
  contractorId: string,
  date: string,
): OverrideState {
  const forContractor = state[contractorId];
  if (!forContractor || !(date in forContractor)) return state;
  const { [date]: _removed, ...rest } = forContractor;
  return { ...state, [contractorId]: rest };
}

export function setJobSplitsOverride(jobIds: string[]): JobSplitOverride[] {
  const percents = evenAllocation(jobIds.length);
  return jobIds.map((jobId, i) => ({ jobId, allocationPercent: percents[i] }));
}

export interface TargetCell {
  contractorId: string;
  date: string;
}

/** Selected employees × days; empty side = all on that axis. */
export function getTargetCells(
  contractors: Contractor[],
  dates: string[],
  selectedEmployees: Set<string>,
  selectedDates: Set<string>,
): TargetCell[] {
  if (selectedEmployees.size === 0 && selectedDates.size === 0) return [];

  const employees =
    selectedEmployees.size > 0
      ? contractors.filter((c) => selectedEmployees.has(c.id))
      : contractors;
  const days = selectedDates.size > 0 ? dates.filter((d) => selectedDates.has(d)) : dates;

  return employees.flatMap((c) => days.map((date) => ({ contractorId: c.id, date })));
}

export function isCellSelected(
  contractorId: string,
  date: string,
  selectedEmployees: Set<string>,
  selectedDates: Set<string>,
): boolean {
  if (selectedEmployees.size === 0 && selectedDates.size === 0) return false;
  const empOk = selectedEmployees.size === 0 || selectedEmployees.has(contractorId);
  const dayOk = selectedDates.size === 0 || selectedDates.has(date);
  return empOk && dayOk;
}
