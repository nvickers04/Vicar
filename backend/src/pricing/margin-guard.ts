import type { PricingProfile } from '../types/index.js';
import type { BillRateContext, BillRateResult } from './types.js';
import { marginPercent } from './utils.js';

export interface MarginCheckResult {
  grossMarginPercent: number;
  withinTarget: boolean;
  warnings: string[];
}

/** Enforces Vicar's 34–40% gross margin target from core-business-plan.md. */
export function checkMargin(
  billRate: number,
  costRate: number,
  profile: Pick<PricingProfile, 'marginMinPercent' | 'marginMaxPercent'>,
): MarginCheckResult {
  const grossMarginPercent = marginPercent(billRate, costRate);
  const warnings: string[] = [];

  if (grossMarginPercent < profile.marginMinPercent) {
    warnings.push(
      `Gross margin ${grossMarginPercent.toFixed(2)}% is below minimum target ${profile.marginMinPercent}%`,
    );
  }
  if (grossMarginPercent > profile.marginMaxPercent) {
    warnings.push(
      `Gross margin ${grossMarginPercent.toFixed(2)}% exceeds maximum target ${profile.marginMaxPercent}%`,
    );
  }

  return {
    grossMarginPercent,
    withinTarget:
      grossMarginPercent >= profile.marginMinPercent &&
      grossMarginPercent <= profile.marginMaxPercent,
    warnings,
  };
}

export function aggregateMargin(
  lineItems: { amount: number; payRate: number; hours: number; hourType: string }[],
): number {
  let totalBill = 0;
  let totalCost = 0;
  for (const item of lineItems) {
    if (item.hourType === 'FEE' || item.hourType === 'PASS_THROUGH') {
      totalBill += item.amount;
      continue;
    }
    totalBill += item.amount;
    totalCost += item.payRate * item.hours;
  }
  if (totalBill <= 0) return 0;
  return marginPercent(totalBill, totalCost);
}
