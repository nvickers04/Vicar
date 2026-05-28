'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { PortalNav } from '@/components/PortalNav';
import { api, ApiError } from '@/lib/api';
import type { Contractor, EntryMode, WeeklyTimesheetSubmission } from '@/lib/types';
import { employeeMetrics, type EmployeeMetrics } from '@/lib/metrics';
import { TimeField, NumberField } from '@/components/matrix/SmartFields';

export default function EmployeesPage() {
  const [rows, setRows] = useState<Contractor[]>([]);
  const [history, setHistory] = useState<WeeklyTimesheetSubmission[]>([]);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.contractors(), api.payrollHistory()])
      .then(([c, h]) => {
        setRows(c);
        setHistory(h);
      })
      .catch((err: ApiError) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => employeeMetrics(history), [history]);

  const summary = useMemo(() => {
    const active = rows.filter((r) => (r.status ?? 'active') === 'active').length;
    const totalPayout = Object.values(metrics).reduce((s, m) => s + m.payout, 0);
    const totalHours = Object.values(metrics).reduce((s, m) => s + m.stHours + m.otHours, 0);
    return { active, inactive: rows.length - active, totalPayout, totalHours };
  }, [rows, metrics]);

  async function patch(id: string, data: Parameters<typeof api.updateContractor>[1]) {
    try {
      const updated = await api.updateContractor(id, data);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  }

  function patchDefaults(id: string, td: Partial<Contractor['timeDefaults']>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, timeDefaults: { ...r.timeDefaults, ...td } } : r)),
    );
    patch(id, { timeDefaults: td });
  }

  async function addEmployee() {
    if (!newName.trim()) return;
    try {
      const c = await api.createContractor({ displayName: newName.trim() });
      setRows((prev) => [...prev, c]);
      setNewName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Add failed');
    }
  }

  async function remove(id: string) {
    try {
      await api.deleteContractor(id);
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employees</h1>
          <p className="mt-1 text-sm text-slate-600">
            Each person&apos;s defaults pre-fill the timesheet editor. New employees appear on the
            grid automatically — their times and jobs stay empty until entered.
          </p>
        </header>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Active" value={summary.active} />
          <Stat label="Inactive" value={summary.inactive} />
          <Stat label="Hours billed (all time)" value={summary.totalHours.toFixed(1)} />
          <Stat label="Payout (all time)" value={`$${summary.totalPayout.toLocaleString()}`} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[1080px] w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Employee</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Method</th>
                <th className="px-3 py-2.5 font-medium">Default start</th>
                <th className="px-3 py-2.5 font-medium">Break</th>
                <th className="px-3 py-2.5 font-medium">Pay rate</th>
                <th className="px-3 py-2.5 text-right font-medium">ST / OT</th>
                <th className="px-3 py-2.5 text-right font-medium">Weeks</th>
                <th className="px-3 py-2.5 text-right font-medium">Payout</th>
                <th className="px-3 py-2.5 font-medium">Last</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const m: EmployeeMetrics = metrics[c.id] ?? {
                  stHours: 0,
                  otHours: 0,
                  payout: 0,
                  weeks: 0,
                };
                const active = (c.status ?? 'active') === 'active';
                return (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2">
                      <input
                        defaultValue={c.displayName}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== c.displayName) patch(c.id, { displayName: v });
                        }}
                        className="w-40 rounded-md border border-transparent px-2 py-1 font-medium text-slate-900 hover:border-slate-200 focus:border-blue-400 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          patch(c.id, { status: active ? 'inactive' : 'active' })
                        }
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={c.timeDefaults.defaultEntryMode}
                        onChange={(e) =>
                          patchDefaults(c.id, { defaultEntryMode: e.target.value as EntryMode })
                        }
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="start_end">Start + End</option>
                        <option value="start_hours">Start + Hours</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-20">
                        <TimeField
                          value={c.timeDefaults.defaultStartTime}
                          onCommit={(v) => patchDefaults(c.id, { defaultStartTime: v })}
                          ariaLabel={`${c.displayName} default start`}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-16">
                        <NumberField
                          value={c.timeDefaults.defaultBreakMinutes}
                          kind="int"
                          suffix="m"
                          onCommit={(n) => patchDefaults(c.id, { defaultBreakMinutes: n })}
                          ariaLabel={`${c.displayName} break`}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-20">
                        <NumberField
                          value={c.defaultPayRate}
                          suffix="$"
                          onCommit={(n) => patch(c.id, { defaultPayRate: n })}
                          ariaLabel={`${c.displayName} pay rate`}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {m.stHours.toFixed(1)} / <span className="text-amber-600">{m.otHours.toFixed(1)}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">{m.weeks}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      ${m.payout.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {m.lastSubmitted ? new Date(m.lastSubmitted).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
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
                  <td colSpan={11} className="px-3 py-8 text-center text-slate-500">
                    No employees yet. Add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addEmployee();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New employee name"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
          >
            Add employee
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
