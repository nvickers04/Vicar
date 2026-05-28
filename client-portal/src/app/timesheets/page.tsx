'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { MatrixTimesheet } from '@/components/matrix/MatrixTimesheet';
import { PortalNav } from '@/components/PortalNav';

export default function TimesheetsPage() {
  return (
    <AuthGuard>
      <PortalNav wide />
      <main className="mx-auto w-full max-w-[1680px] flex-1 px-3 py-4 sm:px-4">
        <header className="mb-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Weekly timesheet
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Click any cell to enter a day&apos;s time and job. Check rows/columns to batch-apply.
            Manage employees, jobs, and defaults in the sidebar.
          </p>
        </header>
        <MatrixTimesheet />
      </main>
    </AuthGuard>
  );
}
