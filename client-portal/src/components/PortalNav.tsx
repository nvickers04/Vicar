'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getUser } from '@/lib/auth';

const links = [
  { href: '/dashboard', label: 'Home' },
  { href: '/timesheets', label: 'Enter hours' },
  { href: '/employees', label: 'Employees' },
  { href: '/jobs', label: 'Jobs' },
];

export function PortalNav({ wide = false }: { wide?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div
        className={`mx-auto flex items-center justify-between px-4 py-3 ${wide ? 'max-w-[1600px]' : 'max-w-6xl'}`}
      >
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-slate-900">Vicar Client Portal</span>
          <nav className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  pathname.startsWith(link.href)
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{user?.name}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
