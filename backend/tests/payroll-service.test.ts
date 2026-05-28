import { beforeEach, describe, expect, it } from 'vitest';
import { clearCalculationLogs } from '../src/pricing/compliance.js';
import { calculateBillRateBatch } from '../src/pricing/engine.js';
import { runPayroll } from '../src/services/payroll-service.js';
import type { Job, PricingProfile, TimesheetEntry } from '../src/types/index.js';

const profile: PricingProfile = {
  id: 'profile-1',
  clientId: 'client-1',
  name: 'Acme — percentage markup',
  strategyType: 'percentage_markup',
  params: { markupPercent: 42, otMultiplier: 1.35 },
  marginMinPercent: 34,
  marginMaxPercent: 40,
  isActive: true,
  effectiveFrom: '2026-05-01',
  createdAt: '2026-05-01T00:00:00.000Z',
};

const jobA: Job = {
  id: 'job-a',
  clientId: 'client-1',
  jobNumber: 'JOB-1001',
  name: 'Warehouse shift',
  status: 'active',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const jobB: Job = {
  id: 'job-b',
  clientId: 'client-1',
  jobNumber: 'JOB-1002',
  name: 'Loading dock',
  status: 'active',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const entry = (
  overrides: Partial<TimesheetEntry> &
    Pick<TimesheetEntry, 'jobId' | 'contractorId' | 'workDate' | 'stHours' | 'payRate'>,
): TimesheetEntry => ({
  id: `entry-${overrides.workDate}-${overrides.contractorId}`,
  clientId: 'client-1',
  jobId: overrides.jobId,
  contractorId: overrides.contractorId,
  workDate: overrides.workDate,
  stHours: overrides.stHours,
  otHours: overrides.otHours ?? 0,
  payRate: overrides.payRate,
  contractorName: overrides.contractorName,
  createdAt: '2026-05-07T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => clearCalculationLogs());

describe('calculateBillRateBatch', () => {
  it('groups per-day entries by job and calculates bill rates', () => {
    const entries: TimesheetEntry[] = [
      entry({ jobId: jobA.id, contractorId: 'c1', contractorName: 'Alice', workDate: '2026-05-01', stHours: 8, payRate: 20 }),
      entry({ jobId: jobA.id, contractorId: 'c1', contractorName: 'Alice', workDate: '2026-05-02', stHours: 8, payRate: 20 }),
      entry({ jobId: jobB.id, contractorId: 'c2', contractorName: 'Bob', workDate: '2026-05-01', stHours: 10, payRate: 25 }),
    ];

    const results = calculateBillRateBatch({ profile, entries, jobs: [jobA, jobB] });

    expect(results).toHaveLength(2);
    expect(results[0].jobNumber).toBe('JOB-1001');
    expect(results[0].billRate.stBillRate).toBe(28.4); // 20 × 1.42
    expect(results[1].jobNumber).toBe('JOB-1002');
    expect(results[1].billRate.stBillRate).toBe(35.5); // 25 × 1.42
  });
});

describe('runPayroll', () => {
  it('produces client invoice lines per job and contractor payments', () => {
    const entries: TimesheetEntry[] = [
      entry({ jobId: jobA.id, contractorId: 'c1', contractorName: 'Alice', workDate: '2026-05-01', stHours: 8, payRate: 20 }),
      entry({ jobId: jobA.id, contractorId: 'c1', contractorName: 'Alice', workDate: '2026-05-02', stHours: 8, otHours: 2, payRate: 20 }),
      entry({ jobId: jobB.id, contractorId: 'c2', contractorName: 'Bob', workDate: '2026-05-01', stHours: 10, payRate: 25 }),
    ];

    const result = runPayroll({ profile, entries, jobs: [jobA, jobB] });

    expect(result.periodStart).toBe('2026-05-01');
    expect(result.periodEnd).toBe('2026-05-02');
    expect(result.invoiceLinesByJob).toHaveLength(2);

    const jobAInvoice = result.invoiceLinesByJob.find((g) => g.jobNumber === 'JOB-1001')!;
    expect(jobAInvoice.lineItems.every((l) => l.jobNumber === 'JOB-1001')).toBe(true);
    expect(jobAInvoice.subtotal).toBeGreaterThan(0);

    expect(result.contractorPayments).toHaveLength(2);
    const alicePay = result.contractorPayments.find((p) => p.contractorId === 'c1')!;
    expect(alicePay.stHours).toBe(16);
    expect(alicePay.otHours).toBe(2);
    expect(alicePay.stAmount).toBe(320);
    expect(alicePay.otAmount).toBe(60); // 2 × 20 × 1.5

    expect(result.totalInvoice).toBeGreaterThan(result.totalContractorPayout);
    expect(result.marginPercent).toBeGreaterThan(0);
  });

  it('aggregates multiple days on the same job for one contractor', () => {
    const entries: TimesheetEntry[] = [
      entry({ jobId: jobA.id, contractorId: 'c1', workDate: '2026-05-01', stHours: 8, payRate: 20 }),
      entry({ jobId: jobA.id, contractorId: 'c1', workDate: '2026-05-02', stHours: 8, payRate: 20 }),
    ];

    const result = runPayroll({ profile, entries, jobs: [jobA] });
    expect(result.invoiceLinesByJob[0].lineItems.find((l) => l.hourType === 'ST')?.hours).toBe(16);
  });
});
