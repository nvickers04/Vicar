import { store } from '../store/memory-store.js';

/** Demo seed data for client portal development. Idempotent on server restart. */
export function seedDemoData() {
  if (store.clients.list().length > 0) return;

  const client = store.clients.create({ name: 'Acme Manufacturing', externalRef: 'ACME-001' });

  store.portalUsers.create({
    clientId: client.id,
    email: 'client@acme.com',
    password: 'demo123',
    role: 'client',
    name: 'Acme Timekeeper',
  });

  store.pricingProfiles.create({
    clientId: client.id,
    name: 'Acme — standard markup',
    strategyType: 'percentage_markup',
    params: { markupPercent: 42, otMultiplier: 1.35 },
    marginMinPercent: 34,
    marginMaxPercent: 40,
    isActive: true,
    effectiveFrom: '2026-01-01',
  });

  store.jobs.create({
    clientId: client.id,
    jobNumber: 'JOB-1001',
    name: 'Warehouse — inbound',
    status: 'active',
  });

  store.jobs.create({
    clientId: client.id,
    jobNumber: 'JOB-1002',
    name: 'Loading dock — outbound',
    status: 'active',
  });

  store.jobs.create({
    clientId: client.id,
    jobNumber: 'JOB-1003',
    name: 'Assembly line support',
    status: 'active',
  });

  store.contractors.create({
    clientId: client.id,
    displayName: 'Maria Santos',
    roleCode: 'WAREHOUSE',
    defaultPayRate: 22,
    timeDefaults: {
      defaultStartTime: '06:30',
      defaultBreakMinutes: 30,
      otRule: 'daily_8',
      defaultEntryMode: 'start_end',
    },
  });

  store.contractors.create({
    clientId: client.id,
    displayName: 'James Chen',
    roleCode: 'LOADER',
    defaultPayRate: 24,
    timeDefaults: {
      defaultStartTime: '07:00',
      defaultBreakMinutes: 45,
      otRule: 'daily_8',
      defaultEntryMode: 'start_hours',
    },
  });

  store.contractors.create({
    clientId: client.id,
    displayName: 'Priya Patel',
    roleCode: 'ASSEMBLY',
    defaultPayRate: 26,
    timeDefaults: {
      defaultStartTime: '08:00',
      defaultBreakMinutes: 30,
      otRule: 'daily_10',
      defaultEntryMode: 'start_end',
    },
  });

  console.log('Demo data seeded — login: client@acme.com / demo123');
}
