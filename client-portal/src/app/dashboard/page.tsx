'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { PortalNav } from '@/components/PortalNav';
import { api, ApiError } from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { Job, WeeklyTimesheetSubmission } from '@/lib/types';
import { formatWeekLabel } from '@/lib/time-utils';

export default function DashboardPage() {
  const user = getUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<WeeklyTimesheetSubmission[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.jobs(), api.payrollHistory()])
      .then(([j, h]) => {
        setJobs(j);
        setHistory(h);
      })
      .catch((err: ApiError) => setError(err.message));
  }, []);

  return (
    <AuthGuard>
      <PortalNav />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome{user ? `, ${user.name}` : ''}</h1>
          <p className="text-sm text-slate-600">
            Review active jobs, submit weekly hours, and see past timesheet submissions.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/timesheets"
            className="rounded-xl border border-slate-900 bg-slate-900 p-6 text-white shadow-sm hover:bg-slate-800"
          >
            <h2 className="text-lg font-semibold">Enter this week&apos;s hours</h2>
            <p className="mt-1 text-sm text-slate-300">
              Mon–Sun grid with job splits, start/end or total hours entry.
            </p>
          </Link>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Quick stats</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">{jobs.length}</p>
            <p className="text-sm text-slate-600">Active jobs</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{history.length}</p>
            <p className="text-sm text-slate-600">Submitted timesheets</p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Active jobs</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="font-mono text-sm font-semibold text-slate-900">{job.jobNumber}</p>
                <p className="text-sm text-slate-600">{job.name ?? '—'}</p>
              </div>
            ))}
            {jobs.length === 0 && (
              <p className="text-sm text-slate-500">No active jobs. Contact your Vicar rep.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Timesheet history</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Entries</th>
                  <th className="px-4 py-3 font-medium">ST / OT hrs</th>
                  <th className="px-4 py-3 font-medium">Invoice total</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      {formatWeekLabel(row.periodStart, row.periodEnd)}
                    </td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3">{row.entryCount}</td>
                    <td className="px-4 py-3">
                      {row.totalStHours} / {row.totalOtHours}
                    </td>
                    <td className="px-4 py-3">
                      {row.payrollResult
                        ? `$${row.payrollResult.totalInvoice.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No submissions yet.{' '}
                      <Link href="/timesheets" className="text-slate-900 underline">
                        Enter your first week
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
