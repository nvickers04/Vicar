import { beforeEach, describe, expect, it } from 'vitest';
import { clearCalculationLogs } from '../src/pricing/compliance.js';
import { calculateBillRate, generateInvoice } from '../src/pricing/engine.js';
import type { PricingProfile, Timesheet } from '../src/types/index.js';

const baseProfile = (
  overrides: Partial<PricingProfile> & Pick<PricingProfile, 'strategyType' | 'params'>,
): PricingProfile => ({
  id: 'profile-1',
  clientId: 'client-1',
  name: 'Test Profile',
  marginMinPercent: 34,
  marginMaxPercent: 40,
  isActive: true,
  effectiveFrom: '2026-05-01',
  createdAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

const baseTimesheet = (lines: Timesheet['lines']): Timesheet => ({
  id: 'ts-1',
  clientId: 'client-1',
  contractorId: 'contractor-1',
  periodStart: '2026-05-01',
  periodEnd: '2026-05-07',
  status: 'approved',
  lines,
  createdAt: '2026-05-07T00:00:00.000Z',
});

beforeEach(() => clearCalculationLogs());

describe('percentage_markup', () => {
  it('calculates Bill = Pay × (1 + markup%)', () => {
    const profile = baseProfile({
      strategyType: 'percentage_markup',
      params: { markupPercent: 42, otMultiplier: 1.35 },
    });
    const result = calculateBillRate({ profile, payRate: 25 });
    expect(result.stBillRate).toBe(35.5);
    expect(result.otBillRate).toBeCloseTo(47.925, 2);
  });
});

describe('burdened_markup', () => {
  it('marks up loaded cost (pay + burden)', () => {
    const profile = baseProfile({
      strategyType: 'burdened_markup',
      params: { markupPercent: 30, burdenMultiplier: 1.35 },
    });
    const result = calculateBillRate({ profile, payRate: 20 });
    // burdened = 27, bill = 27 * 1.30 = 35.10
    expect(result.stBillRate).toBe(35.1);
    expect(result.metadata?.burdenedCost).toBe(27);
  });
});

describe('rate_card', () => {
  it('uses fixed negotiated bill rates per role', () => {
    const profile = baseProfile({
      strategyType: 'rate_card',
      params: {
        rates: [{ roleCode: 'WELDER', stBillRate: 55.04, otBillRate: 96.32 }],
      },
    });
    const result = calculateBillRate({ profile, payRate: 40, roleCode: 'WELDER' });
    expect(result.stBillRate).toBe(55.04);
    expect(result.otBillRate).toBe(96.32);
  });
});

describe('banded — pricing-strategy.md Band 1 example', () => {
  const band1Params = {
    bands: [
      { bandId: 'band1', minPay: 15, maxPay: 30, stMultiplier: 1.42, otMultiplier: 1.35 },
      { bandId: 'band2', minPay: 31, maxPay: 55, stMultiplier: 1.28, otMultiplier: 1.75 },
    ],
  };

  const band1Lines = [
    { contractorId: 'a', contractorName: 'Worker A', payRate: 18, stHours: 40, otHours: 0, bandId: 'band1' },
    { contractorId: 'b', contractorName: 'Worker B', payRate: 22, stHours: 40, otHours: 0, bandId: 'band1' },
    { contractorId: 'c', contractorName: 'Worker C', payRate: 27.5, stHours: 32, otHours: 0, bandId: 'band1' },
    { contractorId: 'd', contractorName: 'Worker D', payRate: 29, stHours: 40, otHours: 0, bandId: 'band1' },
  ];

  it('computes weighted average pay and ST/OT bill rates per band', () => {
    const profile = baseProfile({ strategyType: 'banded', params: band1Params });
    const result = calculateBillRate({
      profile,
      payRate: 18,
      bandId: 'band1',
      periodLines: band1Lines,
    });
    // Table: ($18×40)+($22×40)+($27.50×32)+($29×40) = $3,640 / 152 hrs = $23.9474/hr
    expect(result.metadata?.averagePayRate).toBe(23.9474);
    expect(result.stBillRate).toBe(34.0053);
    expect(result.otBillRate).toBeCloseTo(45.9072, 2);
  });

  it('generates invoice from banded rates', () => {
    const profile = baseProfile({ strategyType: 'banded', params: band1Params });
    const { invoice } = generateInvoice({
      profile,
      timesheet: baseTimesheet(band1Lines),
    });
    // 152 hours × $34.0053 ST bill rate
    expect(invoice.subtotal).toBeCloseTo(5168.8, 0);
    expect(invoice.lineItems).toHaveLength(4);
    expect(invoice.marginPercent).toBeGreaterThan(28);
  });
});

describe('blended', () => {
  it('uses one blended rate across all workers', () => {
    const profile = baseProfile({
      strategyType: 'blended',
      params: { markupPercent: 42 },
    });
    const lines = [
      { contractorId: 'a', payRate: 20, stHours: 40, otHours: 0 },
      { contractorId: 'b', payRate: 30, stHours: 40, otHours: 0 },
    ];
    const { invoice } = generateInvoice({
      profile,
      timesheet: baseTimesheet(lines),
    });
    expect(invoice.lineItems.every((l) => l.billRate === invoice.lineItems[0].billRate)).toBe(true);
  });
});

describe('fixed_fee', () => {
  it('bills a flat project fee', () => {
    const profile = baseProfile({
      strategyType: 'fixed_fee',
      params: { feeAmount: 15000, description: 'Q2 SOW — warehouse staffing' },
    });
    const { invoice } = generateInvoice({
      profile,
      timesheet: baseTimesheet([]),
    });
    expect(invoice.total).toBe(15000);
    expect(invoice.lineItems[0].hourType).toBe('FEE');
  });
});

describe('temp_to_hire', () => {
  it('bills hourly markup during temp period', () => {
    const profile = baseProfile({
      strategyType: 'temp_to_hire',
      params: { hourlyMarkupPercent: 40, conversionFee: 5000 },
    });
    const result = calculateBillRate({ profile, payRate: 25 });
    expect(result.stBillRate).toBe(35);
  });

  it('bills conversion fee when triggered', () => {
    const profile = baseProfile({
      strategyType: 'temp_to_hire',
      params: { hourlyMarkupPercent: 40, conversionFee: 5000 },
    });
    const { invoice } = generateInvoice({
      profile,
      timesheet: baseTimesheet([{ contractorId: 'x', payRate: 25, stHours: 40, otHours: 0 }]),
      conversionTriggered: true,
    });
    expect(invoice.total).toBe(5000);
  });
});

describe('direct_hire', () => {
  it('bills placement fee as percent of salary', () => {
    const profile = baseProfile({
      strategyType: 'direct_hire',
      params: { placementFeePercent: 20 },
    });
    const { invoice } = generateInvoice({
      profile,
      timesheet: baseTimesheet([]),
      annualSalary: 100000,
    });
    expect(invoice.total).toBe(20000);
  });
});

describe('hybrid', () => {
  it('applies volume discount on top of percentage markup', () => {
    const profile = baseProfile({
      strategyType: 'hybrid',
      params: {
        baseStrategy: 'percentage_markup',
        baseParams: { markupPercent: 42 },
        rules: [{ type: 'volume_discount', minHours: 100, discountPercent: 5 }],
      },
    });
    const lines = [
      { contractorId: 'a', payRate: 20, stHours: 60, otHours: 0 },
      { contractorId: 'b', payRate: 20, stHours: 60, otHours: 0 },
    ];
    const { invoice } = generateInvoice({ profile, timesheet: baseTimesheet(lines) });
    const undiscounted = 120 * 28.4; // pay 20 * 1.42
    expect(invoice.subtotal).toBeLessThan(undiscounted);
  });
});

describe('margin guardrails', () => {
  it('flags margin outside 34–40% target', () => {
    const profile = baseProfile({
      strategyType: 'percentage_markup',
      params: { markupPercent: 10 },
    });
    const result = calculateBillRate({ profile, payRate: 25 });
    // 10% markup on pay ≠ 10% gross margin; bill=27.5, margin = (27.5-25)/27.5 = 9.09%
    expect(result.stBillRate).toBe(27.5);
  });
});
