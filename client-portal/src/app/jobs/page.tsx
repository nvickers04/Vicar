'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { PortalNav } from '@/components/PortalNav';
import { api, ApiError } from '@/lib/api';
import type { Job, WeeklyTimesheetSubmission } from '@/lib/types';
import { jobMetricsFromHistory, type JobMetrics } from '@/lib/metrics';

export default function JobsPage() {
  const [rows, setRows] = useState<Job[]>([]);
  const [history, setHistory] = useState<WeeklyTimesheetSubmission[]>([]);
  const [error, setError] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.jobs(), api.payrollHistory()])
      .then(([j, h]) => {
        setRows(j);
        setHistory(h);
      })
      .catch((err: ApiError) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => jobMetricsFromHistory(history), [history]);

  const summary = useMemo(() => {
    const active = rows.filter((r) => r.status === 'active').length;
    const invoiced = Object.values(metrics).reduce((s, m) => s + m.invoiced, 0);
    const hours = Object.values(metrics).reduce((s, m) => s + m.stHours + m.otHours, 0);
    return { active, total: rows.length, invoiced, hours };
  }, [rows, metrics]);

  async function patch(id: string, data: Parameters<typeof api.updateJob>[1]) {
    try {
      const updated = await api.updateJob(id, data);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  }

  async function addJob() {
    if (!newNumber.trim()) return;
    try {
      const j = await api.createJob({ jobNumber: newNumber.trim(), name: newName.trim() || undefined });
      setRows((prev) => [...prev, j]);
      setNewNumber('');
      setNewName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Add failed');
    }
  }

  async function remove(id: string) {
    try {
      await api.deleteJob(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Remove failed');
    }
  }

  return (
    <AuthGuard>
      <PortalNav wide />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6">
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job numbers</h1>
          <p className="mt-1 text-sm text-slate-600">
            Active jobs are selectable in the timesheet editor. Metrics reflect submitted weeks.
          </p>
        </header>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Active jobs" value={summary.active} />
          <Stat label="Total jobs" value={summary.total} />
          <Stat label="Hours billed (all time)" value={summary.hours.toFixed(1)} />
          <Stat label="Invoiced (all time)" value={`$${summary.invoiced.toLocaleString()}`} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Job #</th>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">ST / OT hrs</th>
                <th className="px-3 py-2.5 text-right font-medium">Weeks</th>
                <th className="px-3 py-2.5 text-right font-medium">Invoiced</th>
                <th className="px-3 py-2.5 font-medium">Last used</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => {
                const m: JobMetrics = metrics[j.id] ?? {
                  stHours: 0,
                  otHours: 0,
                  invoiced: 0,
                  weeks: 0,
                };
                return (
                  <tr key={j.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2">
                      <input
                        defaultValue={j.jobNumber}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== j.jobNumber) patch(j.id, { jobNumber: v });
                        }}
                        className="w-28 rounded-md border border-transparent px-2 py-1 font-mono font-medium text-slate-900 hover:border-slate-200 focus:border-blue-400 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        defaultValue={j.name ?? ''}
                        placeholder="—"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (j.name ?? '')) patch(j.id, { name: v });
                        }}
                        className="w-56 rounded-md border border-transparent px-2 py-1 text-slate-700 hover:border-slate-200 focus:border-blue-400 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={j.status}
                        onChange={(e) => patch(j.id, { status: e.target.value })}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs capitalize"
                      >
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {m.stHours.toFixed(1)} /{' '}
                      <span className="text-amber-600">{m.otHours.toFixed(1)}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">{m.weeks}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      ${m.invoiced.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {m.lastUsed ? new Date(m.lastUsed).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => remove(j.id)}
                        className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                    No jobs yet. Add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addJob();
          }}
          className="mt-4 flex flex-wrap gap-2"
        >
          <input
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            placeholder="Job # (e.g. 1042)"
            className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (optional)"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={!newNumber.trim()}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
          >
            Add job
          </button>
        </form>
      </main>
    </AuthGuard>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-xl font-bold tabular-nums text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
