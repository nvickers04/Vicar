import type { ContractorPaymentLine, Job, TimesheetEntry, TimesheetLine } from '../types/index.js';

export interface JobEntryGroup {
  job: Job;
  entries: TimesheetEntry[];
}

/** Sum per-day entries into period lines (one row per contractor per job). */
export function aggregateEntriesToLines(entries: TimesheetEntry[]): TimesheetLine[] {
  const byContractor = new Map<string, TimesheetLine>();

  for (const entry of entries) {
    const key = entry.contractorId;
    const existing = byContractor.get(key);

    if (existing) {
      existing.stHours += entry.stHours;
      existing.otHours += entry.otHours;
      continue;
    }

    byContractor.set(key, {
      contractorId: entry.contractorId,
      contractorName: entry.contractorName,
      roleCode: entry.roleCode,
      payRate: entry.payRate,
      stHours: entry.stHours,
      otHours: entry.otHours,
      burdenedCostPerHour: entry.burdenedCostPerHour,
      bandId: entry.bandId,
    });
  }

  return [...byContractor.values()];
}

/** Group entries by job using a job lookup map. */
export function groupEntriesByJob(
  entries: TimesheetEntry[],
  jobsById: Map<string, Job>,
): JobEntryGroup[] {
  const grouped = new Map<string, TimesheetEntry[]>();

  for (const entry of entries) {
    const list = grouped.get(entry.jobId) ?? [];
    list.push(entry);
    grouped.set(entry.jobId, list);
  }

  return [...grouped.entries()].map(([jobId, jobEntries]) => {
    const job = jobsById.get(jobId);
    if (!job) {
      throw new Error(`Unknown job id: ${jobId}`);
    }
    return { job, entries: jobEntries };
  });
}

/** Derive billing period bounds from entry work dates. */
export function periodBoundsFromEntries(entries: TimesheetEntry[]): {
  periodStart: string;
  periodEnd: string;
} {
  if (entries.length === 0) {
    throw new Error('Cannot derive period from empty timesheet entries');
  }

  const dates = entries.map((e) => e.workDate).sort();
  return { periodStart: dates[0], periodEnd: dates[dates.length - 1] };
}

/** Build contractor payout lines grouped by contractor + job. */
export function aggregateContractorPayments(
  groups: JobEntryGroup[],
  otPayMultiplier = 1.5,
): ContractorPaymentLine[] {
  const payments = new Map<string, ContractorPaymentLine>();

  for (const { job, entries } of groups) {
    for (const entry of entries) {
      const key = `${entry.contractorId}:${job.id}`;
      const stAmount = roundMoney(entry.stHours * entry.payRate);
      const otAmount = roundMoney(entry.otHours * entry.payRate * otPayMultiplier);
      const existing = payments.get(key);

      if (existing) {
        existing.stHours += entry.stHours;
        existing.otHours += entry.otHours;
        existing.stAmount = roundMoney(existing.stAmount + stAmount);
        existing.otAmount = roundMoney(existing.otAmount + otAmount);
        existing.totalAmount = roundMoney(existing.stAmount + existing.otAmount);
        continue;
      }

      payments.set(key, {
        contractorId: entry.contractorId,
        contractorName: entry.contractorName,
        jobId: job.id,
        jobNumber: job.jobNumber,
        stHours: entry.stHours,
        otHours: entry.otHours,
        payRate: entry.payRate,
        stAmount,
        otAmount,
        totalAmount: roundMoney(stAmount + otAmount),
      });
    }
  }

  return [...payments.values()];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
