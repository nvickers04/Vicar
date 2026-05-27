import { v4 as uuidv4 } from 'uuid';
import type {
  Client,
  Contractor,
  Invoice,
  Payment,
  PricingProfile,
  RateSnapshot,
  Timesheet,
} from '../types/index.js';

const clients = new Map<string, Client>();
const contractors = new Map<string, Contractor>();
const pricingProfiles = new Map<string, PricingProfile>();
const timesheets = new Map<string, Timesheet>();
const rateSnapshots = new Map<string, RateSnapshot>();
const invoices = new Map<string, Invoice>();
const payments = new Map<string, Payment>();

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
    create: (data: Omit<Contractor, 'id' | 'createdAt'>) => {
      const contractor: Contractor = { ...data, id: uuidv4(), createdAt: now() };
      contractors.set(contractor.id, contractor);
      return contractor;
    },
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
  /** Test helper — reset all in-memory data. */
  reset: () => {
    clients.clear();
    contractors.clear();
    pricingProfiles.clear();
    timesheets.clear();
    rateSnapshots.clear();
    invoices.clear();
    payments.clear();
  },
};
