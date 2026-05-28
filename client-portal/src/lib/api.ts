import { clearSession, getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function handleUnauthorized() {
  clearSession();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.replace('/login');
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.error ?? body.message ?? res.statusText;
    if (res.status === 401 && path !== '/auth/login') handleUnauthorized();
    throw new ApiError(typeof message === 'string' ? message : JSON.stringify(message), res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: import('./types').PortalUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  jobs: () => request<import('./types').Job[]>('/jobs'),
  createJob: (data: { jobNumber: string; name?: string }) =>
    request<import('./types').Job>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateJob: (id: string, data: { jobNumber?: string; name?: string; status?: string }) =>
    request<import('./types').Job>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteJob: (id: string) => request<void>(`/jobs/${id}`, { method: 'DELETE' }),

  contractors: () => request<import('./types').Contractor[]>('/contractors'),
  createContractor: (data: {
    displayName: string;
    defaultPayRate?: number;
    roleCode?: string;
    timeDefaults?: Partial<import('./types').ContractorTimeDefaults>;
  }) =>
    request<import('./types').Contractor>('/contractors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContractor: (
    id: string,
    data: {
      displayName?: string;
      defaultPayRate?: number;
      roleCode?: string;
      status?: 'active' | 'inactive';
      timeDefaults?: Partial<import('./types').ContractorTimeDefaults>;
    },
  ) =>
    request<import('./types').Contractor>(`/contractors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteContractor: (id: string) =>
    request<void>(`/contractors/${id}`, { method: 'DELETE' }),
  payrollHistory: () => request<import('./types').WeeklyTimesheetSubmission[]>('/payroll/history'),
  runPayroll: (payload: import('./types').PayrollRunPayload) =>
    request<{ submission: import('./types').WeeklyTimesheetSubmission }>('/payroll/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
