import { v4 as uuidv4 } from 'uuid';
import type {
  Client,
  Contractor,
  Invoice,
  Job,
  Payment,
  PortalUser,
  PricingProfile,
  RateSnapshot,
  Timesheet,
  TimesheetEntry,
  WeeklyTimesheetSubmission,
} from '../types/index.js';

const clients = new Map<string, Client>();
const contractors = new Map<string, Contractor>();
const jobs = new Map<string, Job>();
const pricingProfiles = new Map<string, PricingProfile>();
const timesheets = new Map<string, Timesheet>();
const timesheetEntries = new Map<string, TimesheetEntry>();
const rateSnapshots = new Map<string, RateSnapshot>();
const invoices = new Map<string, Invoice>();
const payments = new Map<string, Payment>();
const portalUsers = new Map<string, PortalUser>();
const sessions = new Map<string, { userId: string; clientId: string }>();
const weeklySubmissions = new Map<string, WeeklyTimesheetSubmission>();

function now(): string {
  return new Date().toISOString();
}

export const store = {
  clients: {
    list: () => [...clients.values()],
    get: (id: string) => clients.get(id),
    create: (data: Omit<Client, 'id' | 'createdAt'>) => {
      const client: Client = { ...data, id: uuidv4(), createdAt: now() };
      clients.set(client.id, client);
      return client;
    },
  },
  contractors: {
    list: (clientId?: string) =>
      [...contractors.values()].filter((c) => !clientId || c.clientId === clientId),
    get: (id: string) => contractors.get(id),
    create: (data: Omit<Contractor, 'id' | 'createdAt'>) => {
      const contractor: Contractor = { ...data, id: uuidv4(), createdAt: now() };
      contractors.set(contractor.id, contractor);
      return contractor;
    },
    update: (id: string, data: Partial<Omit<Contractor, 'id' | 'createdAt' | 'clientId'>>) => {
      const existing = contractors.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...data };
      contractors.set(id, updated);
      return updated;
    },
    delete: (id: string) => contractors.delete(id),
  },
  jobs: {
    list: (clientId?: string) =>
      [...jobs.values()].filter((j) => !clientId || j.clientId === clientId),
    get: (id: string) => jobs.get(id),
    create: (data: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
      const job: Job = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
      jobs.set(job.id, job);
      return job;
    },
    update: (id: string, data: Partial<Omit<Job, 'id' | 'createdAt' | 'clientId'>>) => {
      const existing = jobs.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...data, updatedAt: now() };
      jobs.set(id, updated);
      return updated;
    },
    delete: (id: string) => jobs.delete(id),
  },
  pricingProfiles: {
    list: (clientId?: string) =>
      [...pricingProfiles.values()].filter((p) => !clientId || p.clientId === clientId),
    get: (id: string) => pricingProfiles.get(id),
    create: (data: Omit<PricingProfile, 'id' | 'createdAt'>) => {
      const profile: PricingProfile = { ...data, id: uuidv4(), createdAt: now() };
      pricingProfiles.set(profile.id, profile);
      return profile;
    },
    update: (id: string, data: Partial<Omit<PricingProfile, 'id' | 'createdAt'>>) => {
      const existing = pricingProfiles.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...data };
      pricingProfiles.set(id, updated);
      return updated;
    },
    delete: (id: string) => pricingProfiles.delete(id),
  },
  timesheets: {
    list: (clientId?: string) =>
      [...timesheets.values()].filter((t) => !clientId || t.clientId === clientId),
    get: (id: string) => timesheets.get(id),
    create: (data: Omit<Timesheet, 'id' | 'createdAt'>) => {
      const ts: Timesheet = { ...data, id: uuidv4(), createdAt: now() };
      timesheets.set(ts.id, ts);
      return ts;
    },
    update: (id: string, data: Partial<Omit<Timesheet, 'id' | 'createdAt'>>) => {
      const existing = timesheets.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...data };
      timesheets.set(id, updated);
      return updated;
    },
  },
  timesheetEntries: {
    list: (clientId?: string) =>
      [...timesheetEntries.values()].filter((e) => !clientId || e.clientId === clientId),
    create: (data: Omit<TimesheetEntry, 'id' | 'createdAt'>) => {
      const entry: TimesheetEntry = { ...data, id: uuidv4(), createdAt: now() };
      timesheetEntries.set(entry.id, entry);
      return entry;
    },
    createMany: (items: Omit<TimesheetEntry, 'id' | 'createdAt'>[]) =>
      items.map((item) => store.timesheetEntries.create(item)),
  },
  rateSnapshots: {
    create: (data: Omit<RateSnapshot, 'id' | 'createdAt'>) => {
      const snap: RateSnapshot = { ...data, id: uuidv4(), createdAt: now() };
      rateSnapshots.set(snap.id, snap);
      return snap;
    },
    get: (id: string) => rateSnapshots.get(id),
  },
  invoices: {
    list: (clientId?: string) =>
      [...invoices.values()].filter((i) => !clientId || i.clientId === clientId),
    get: (id: string) => invoices.get(id),
    create: (data: Omit<Invoice, 'id' | 'createdAt'>) => {
      const inv: Invoice = { ...data, id: uuidv4(), createdAt: now() };
      invoices.set(inv.id, inv);
      return inv;
    },
  },
  payments: {
    list: (invoiceId?: string) =>
      [...payments.values()].filter((p) => !invoiceId || p.invoiceId === invoiceId),
    create: (data: Omit<Payment, 'id' | 'createdAt'>) => {
      const payment: Payment = { ...data, id: uuidv4(), createdAt: now() };
      payments.set(payment.id, payment);
      return payment;
    },
  },
  portalUsers: {
    findByEmail: (email: string) =>
      [...portalUsers.values()].find((u) => u.email.toLowerCase() === email.toLowerCase()),
    create: (data: Omit<PortalUser, 'id'>) => {
      const user: PortalUser = { ...data, id: uuidv4() };
      portalUsers.set(user.id, user);
      return user;
    },
  },
  sessions: {
    create: (userId: string, clientId: string) => {
      const token = uuidv4();
      sessions.set(token, { userId, clientId });
      return token;
    },
    get: (token: string) => sessions.get(token),
  },
  weeklySubmissions: {
    list: (clientId?: string) =>
      [...weeklySubmissions.values()]
        .filter((s) => !clientId || s.clientId === clientId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    get: (id: string) => weeklySubmissions.get(id),
    create: (data: Omit<WeeklyTimesheetSubmission, 'id' | 'createdAt'>) => {
      const submission: WeeklyTimesheetSubmission = { ...data, id: uuidv4(), createdAt: now() };
      weeklySubmissions.set(submission.id, submission);
      return submission;
    },
  },
  /** Test helper — reset all in-memory data. */
  reset: () => {
    clients.clear();
    contractors.clear();
    jobs.clear();
    pricingProfiles.clear();
    timesheets.clear();
    timesheetEntries.clear();
    rateSnapshots.clear();
    invoices.clear();
    payments.clear();
    portalUsers.clear();
    sessions.clear();
    weeklySubmissions.clear();
  },
};
