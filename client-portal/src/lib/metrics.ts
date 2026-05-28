import type { WeeklyTimesheetSubmission } from './types';
import { round2 } from './time-utils';

export interface EmployeeMetrics {
  stHours: number;
  otHours: number;
  payout: number;
  weeks: number;
  lastSubmitted?: string;
}

export interface JobMetrics {
  stHours: number;
  otHours: number;
  invoiced: number;
  weeks: number;
  lastUsed?: string;
}

function latest(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/** Aggregate per-employee hours / payout across all submissions. */
export function employeeMetrics(
  history: WeeklyTimesheetSubmission[],
): Record<string, EmployeeMetrics> {
  const out: Record<string, EmployeeMetrics> = {};
  for (const sub of history) {
    const payments = sub.payrollResult?.contractorPayments ?? [];
    const seenThisWeek = new Set<string>();
    for (const p of payments) {
      const m = (out[p.contractorId] ??= { stHours: 0, otHours: 0, payout: 0, weeks: 0 });
      m.stHours = round2(m.stHours + p.stHours);
      m.otHours = round2(m.otHours + p.otHours);
      m.payout = round2(m.payout + p.totalAmount);
      m.lastSubmitted = latest(m.lastSubmitted, sub.submittedAt ?? sub.periodEnd);
      if (!seenThisWeek.has(p.contractorId)) {
        seenThisWeek.add(p.contractorId);
        m.weeks += 1;
      }
    }
  }
  return out;
}

/** Aggregate per-job hours / invoice across all submissions. */
export function jobMetricsFromHistory(
  history: WeeklyTimesheetSubmission[],
): Record<string, JobMetrics> {
  const out: Record<string, JobMetrics> = {};
  for (const sub of history) {
    const lines = sub.payrollResult?.invoiceLinesByJob ?? [];
    for (const line of lines) {
      const m = (out[line.jobId] ??= { stHours: 0, otHours: 0, invoiced: 0, weeks: 0 });
      for (const item of line.lineItems) {
        if (item.hourType === 'ST') m.stHours = round2(m.stHours + item.hours);
        else if (item.hourType === 'OT') m.otHours = round2(m.otHours + item.hours);
      }
      m.invoiced = round2(m.invoiced + line.subtotal);
      m.weeks += 1;
      m.lastUsed = latest(m.lastUsed, sub.submittedAt ?? sub.periodEnd);
    }
  }
  return out;
}
