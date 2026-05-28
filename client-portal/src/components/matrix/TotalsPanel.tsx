'use client';

import type { Job } from '@/lib/types';
import type { JobTotal } from '@/lib/payroll-build';
import { round2 } from '@/lib/time-utils';

interface TotalsPanelProps {
  jobs: Job[];
  totals: JobTotal[];
  workingCount: number;
  employeeCount: number;
}

export function TotalsPanel({ jobs, totals, workingCount, employeeCount }: TotalsPanelProps) {
  const grandSt = round2(totals.reduce((s, t) => s + t.stHours, 0));
  const grandOt = round2(totals.reduce((s, t) => s + t.otHours, 0));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Hours by job</h3>
        <span className="text-xs text-slate-500">
          {workingCount} of {employeeCount} working
        </span>
      </div>

      {totals.length === 0 ? (
        <p className="py-3 text-center text-xs text-slate-400">
          No hours entered yet. Click a cell to add time.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
              <th className="py-1 text-left font-medium">Job</th>
              <th className="py-1 text-right font-medium">ST</th>
              <th className="py-1 text-right font-medium">OT</th>
              <th className="py-1 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((t) => {
              const job = jobs.find((j) => j.id === t.jobId);
              return (
                <tr key={t.jobId} className="border-b border-slate-50">
                  <td className="py-1.5">
                    <span className="font-mono text-xs text-slate-700">
                      {job?.jobNumber ?? '—'}
                    </span>
                    {job?.name && (
                      <span className="ml-1.5 text-xs text-slate-400">{job.name}</span>
                    )}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-700">
                    {t.stHours.toFixed(1)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-amber-600">
                    {t.otHours > 0 ? t.otHours.toFixed(1) : '—'}
                  </td>
                  <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900">
                    {round2(t.stHours + t.otHours).toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 font-bold">
              <td className="py-1.5 text-xs uppercase tracking-wide text-slate-500">Total</td>
              <td className="py-1.5 text-right tabular-nums text-slate-900">{grandSt.toFixed(1)}</td>
              <td className="py-1.5 text-right tabular-nums text-amber-600">
                {grandOt > 0 ? grandOt.toFixed(1) : '—'}
              </td>
              <td className="py-1.5 text-right tabular-nums text-slate-900">
                {round2(grandSt + grandOt).toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
