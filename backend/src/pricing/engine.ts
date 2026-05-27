import { v4 as uuidv4 } from 'uuid';
import type { Invoice, PricingProfile, RateSnapshot, Timesheet } from '../types/index.js';
import { logCalculation } from './compliance.js';
import { aggregateMargin, checkMargin } from './margin-guard.js';
import { getRawStrategy } from './registry.js';
import type { BillRateContext, BillRateResult } from './types.js';
import { roundMoney } from './utils.js';

export interface CalculateBillRateInput {
  profile: PricingProfile;
  payRate: number;
  burdenedCostPerHour?: number;
  roleCode?: string;
  bandId?: string;
  periodLines?: BillRateContext['periodLines'];
}

export interface GenerateInvoiceInput {
  profile: PricingProfile;
  timesheet: Timesheet;
  conversionTriggered?: boolean;
  annualSalary?: number;
}

export interface GenerateInvoiceOutput {
  invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'rateSnapshotId'>;
  rateSnapshot: Omit<RateSnapshot, 'id' | 'createdAt'>;
}

/** Route to the correct strategy and calculate ST/OT bill rates for one worker context. */
export function calculateBillRate(input: CalculateBillRateInput): BillRateResult {
  const { profile, ...ctx } = input;
  const strategy = getRawStrategy(profile.strategyType);

  if (profile.strategyType === 'hybrid') {
    throw new Error('Use generateInvoice or preview for hybrid profiles');
  }

  const result = strategy.calculateBillRate(
    {
      payRate: ctx.payRate,
      burdenedCostPerHour: ctx.burdenedCostPerHour,
      roleCode: ctx.roleCode,
      bandId: ctx.bandId,
      periodLines: ctx.periodLines,
    },
    profile.params,
  );

  const marginCheck = checkMargin(result.stBillRate, ctx.payRate, profile);

  logCalculation({
    clientId: profile.clientId,
    pricingProfileId: profile.id,
    operation: 'calculate_bill_rate',
    inputPayload: { ...input },
    outputPayload: { ...result, marginCheck },
    marginPercent: marginCheck.grossMarginPercent,
    withinMarginTarget: marginCheck.withinTarget,
  });

  return result;
}

/** Generate invoice line items with immutable rate snapshot. */
export function generateInvoice(input: GenerateInvoiceInput): GenerateInvoiceOutput {
  const { profile, timesheet } = input;
  const strategy = getRawStrategy(profile.strategyType);

  const invoiceResult = strategy.generateLineItems({
    clientId: profile.clientId,
    periodStart: timesheet.periodStart,
    periodEnd: timesheet.periodEnd,
    lines: timesheet.lines,
    params: profile.params,
    conversionTriggered: input.conversionTriggered,
    annualSalary: input.annualSalary,
  });

  const marginPercentValue = aggregateMargin(invoiceResult.lineItems);
  const marginSummary = {
    grossMarginPercent: marginPercentValue,
    withinTarget:
      marginPercentValue >= profile.marginMinPercent &&
      marginPercentValue <= profile.marginMaxPercent,
    warnings: [] as string[],
  };

  if (!marginSummary.withinTarget) {
    marginSummary.warnings.push(
      `Invoice gross margin ${marginPercentValue.toFixed(2)}% outside ${profile.marginMinPercent}–${profile.marginMaxPercent}% target`,
    );
  }

  const rateSnapshot: Omit<RateSnapshot, 'id' | 'createdAt'> = {
    pricingProfileId: profile.id,
    clientId: profile.clientId,
    strategyType: profile.strategyType,
    params: profile.params,
    computedRates: invoiceResult.computedRates,
    marginSummary,
  };

  logCalculation({
    clientId: profile.clientId,
    pricingProfileId: profile.id,
    operation: 'generate_invoice',
    inputPayload: { profileId: profile.id, timesheetId: timesheet.id },
    outputPayload: {
      subtotal: invoiceResult.subtotal,
      lineCount: invoiceResult.lineItems.length,
      marginSummary,
    },
    marginPercent: marginPercentValue,
    withinMarginTarget: marginSummary.withinTarget,
  });

  const invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'rateSnapshotId'> = {
    clientId: profile.clientId,
    timesheetId: timesheet.id,
    pricingProfileId: profile.id,
    periodStart: timesheet.periodStart,
    periodEnd: timesheet.periodEnd,
    lineItems: invoiceResult.lineItems,
    subtotal: roundMoney(invoiceResult.subtotal),
    adjustments: 0,
    total: roundMoney(invoiceResult.subtotal),
    marginPercent: marginPercentValue,
    status: 'draft',
  };

  return { invoice, rateSnapshot };
}

export function createInvoiceNumber(): string {
  return `INV-${Date.now()}-${uuidv4().slice(0, 8)}`;
}
