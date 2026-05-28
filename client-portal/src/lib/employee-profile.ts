import type { Contractor, EntryMode, OtRule } from './types';

/** Local portal overrides — can differ from backend defaults per session. */
export interface EmployeeProfile {
  entryMode: EntryMode;
  defaultStartTime: string;
  defaultBreakMinutes: number;
  defaultEndTime: string;
  defaultTotalHours: number;
  otRule: OtRule;
}

export function profileFromContractor(c: Contractor): EmployeeProfile {
  const d = c.timeDefaults;
  return {
    entryMode: d.defaultEntryMode,
    defaultStartTime: d.defaultStartTime,
    defaultBreakMinutes: d.defaultBreakMinutes,
    defaultEndTime: '15:30',
    defaultTotalHours: 8,
    otRule: d.otRule,
  };
}

export function getEmployeeProfile(
  profiles: Record<string, EmployeeProfile>,
  contractor: Contractor,
): EmployeeProfile {
  return profiles[contractor.id] ?? profileFromContractor(contractor);
}
