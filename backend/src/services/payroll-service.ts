import type {
  ClientInvoiceLinesByJob,
  InvoiceLineItem,
  Job,
  PayrollRunResult,
  PricingProfile,
  TimesheetEntry,
} from '../types/index.js';
import { logCalculation } from '../pricing/compliance.js';
import { getRawStrategy } from '../pricing/registry.js';
import {
  aggregateContractorPayments,
  aggregateEntriesToLines,
  groupEntriesByJob,
  periodBoundsFromEntries,
} from '../pricing/entry-utils.js';
import { aggregateMargin } from '../pricing/margin-guard.js';
import { roundMoney } from '../pricing/utils.js';

export interface RunPayrollInput {
  profile: PricingProfile;
  entries: TimesheetEntry[];
  jobs: Job[];
  conversionTriggered?: boolean;
  annualSalary?: number;
  /** OT pay multiplier for contractor payouts (default 1.5×). */
  contractorOtMultiplier?: number;
}

function tagLineItemsWithJob(
  lineItems: InvoiceLineItem[],
  job: Job,
): InvoiceLineItem[] {
  return lineItems.map((item) => ({
    ...item,
    jobId: job.id,
    jobNumber: job.jobNumber,
    description: `[${job.jobNumber}] ${item.description}`,
  }));
}

/**
 * Run payroll for a batch of per-day timesheet entries.
 * Produces client invoice lines grouped by job number and contractor payment lines.
 */
export function runPayroll(input: RunPayrollInput): PayrollRunResult {
  if (input.entries.length === 0) {
    throw new Error('runPayroll requires at least one timesheet entry');
  }

  const { profile, entries, jobs } = input;
  const jobsById = new Map(jobs.map((j) => [j.id, j]));
  const groups = groupEntriesByJob(entries, jobsById);
  const { periodStart, periodEnd } = periodBoundsFromEntries(entries);
  const strategy = getRawStrategy(profile.strategyType);

  const invoiceLinesByJob: ClientInvoiceLinesByJob[] = [];
  const computedRates: Record<string, unknown> = {};

  for (const { job, entries: jobEntries } of groups) {
    const lines = aggregateEntriesToLines(jobEntries);

    const invoiceResult = strategy.generateLineItems({
      clientId: profile.clientId,
      periodStart,
      periodEnd,
      lines,
      params: profile.params,
      conversionTriggered: input.conversionTriggered,
      annualSalary: input.annualSalary,
    });

    const taggedItems = tagLineItemsWithJob(invoiceResult.lineItems, job);
    const subtotal = roundMoney(taggedItems.reduce((sum, item) => sum + item.amount, 0));

    invoiceLinesByJob.push({
      jobId: job.id,
      jobNumber: job.jobNumber,
      lineItems: taggedItems,
      subtotal,
      marginPercent: aggregateMargin(taggedItems),
    });

    computedRates[`job:${job.jobNumber}`] = invoiceResult.computedRates;
  }

  const contractorPayments = aggregateContractorPayments(
    groups,
    input.contractorOtMultiplier ?? 1.5,
  );

  const allLineItems = invoiceLinesByJob.flatMap((g) => g.lineItems);
  const totalInvoice = roundMoney(invoiceLinesByJob.reduce((sum, g) => sum + g.subtotal, 0));
  const totalContractorPayout = roundMoney(
    contractorPayments.reduce((sum, p) => sum + p.totalAmount, 0),
  );
  const marginPercent = aggregateMargin(allLineItems);

  logCalculation({
    clientId: profile.clientId,
    pricingProfileId: profile.id,
    operation: 'run_payroll',
    inputPayload: {
      profileId: profile.id,
      entryCount: entries.length,
      jobCount: groups.length,
    },
    outputPayload: {
      totalInvoice,
      totalContractorPayout,
      marginPercent,
      jobs: invoiceLinesByJob.map((g) => g.jobNumber),
    },
    marginPercent,
    withinMarginTarget:
      marginPercent >= profile.marginMinPercent && marginPercent <= profile.marginMaxPercent,
  });

  return {
    clientId: profile.clientId,
    periodStart,
    periodEnd,
    invoiceLinesByJob,
    contractorPayments,
    totalInvoice,
    totalContractorPayout,
    marginPercent,
    computedRates,
  };
}
