import type { InvoiceLineItem, PricingStrategyType, TimesheetLine } from '../types/index.js';

/** Percentage markup on pay rate: Bill = Pay × (1 + markup%). */
export interface PercentageMarkupParams {
  markupPercent: number;
  /** OT bill = ST bill × otMultiplier (default 1.5). */
  otMultiplier?: number;
}

/** Markup on burdened (loaded) cost — pay + taxes + WC + benefits + overhead. */
export interface BurdenedMarkupParams {
  markupPercent: number;
  /** If set, burden = payRate × burdenMultiplier; else use line.burdenedCostPerHour. */
  burdenMultiplier?: number;
  otMultiplier?: number;
}

export interface RateCardEntry {
  roleCode: string;
  stBillRate: number;
  otBillRate?: number;
}

/** Fixed / negotiated bill rates per role. */
export interface RateCardParams {
  rates: RateCardEntry[];
  defaultOtMultiplier?: number;
}

export interface PayBand {
  bandId: string;
  minPay: number;
  maxPay: number;
  stMultiplier: number;
  otMultiplier: number;
}

/** Banded / tiered — matches pricing-strategy.md (average pay per band + ST/OT multipliers). */
export interface BandedParams {
  bands: PayBand[];
}

/** Blended / average rate across workers. */
export interface BlendedParams {
  /** If omitted, computed from timesheet lines. */
  blendedPayRate?: number;
  markupPercent: number;
  otMultiplier?: number;
}

/** Fixed fee / project-based / SOW. */
export interface FixedFeeParams {
  feeAmount: number;
  description: string;
  /** Optional pass-through costs billed at cost + admin fee. */
  passThroughAmount?: number;
  adminFeePercent?: number;
}

/** Temp-to-hire with conversion fee after trial period. */
export interface TempToHireParams {
  /** Hourly markup while on temp assignment. */
  hourlyMarkupPercent: number;
  otMultiplier?: number;
  /** Flat fee when worker converts to client hire. */
  conversionFee: number;
  /** If true, invoice includes conversion fee line instead of hourly. */
  conversionTriggered?: boolean;
}

/** Direct-hire placement fee (one-time). */
export interface DirectHireParams {
  /** Percent of first-year salary. */
  placementFeePercent?: number;
  /** Flat placement fee (used if percent not set). */
  flatFee?: number;
  /** Annual salary basis for percent calculation. */
  annualSalary?: number;
}

export interface HybridRule {
  type: 'volume_discount' | 'ot_override' | 'not_to_exceed' | 'pass_through_admin';
  /** Threshold hours for volume discount. */
  minHours?: number;
  discountPercent?: number;
  /** Cap total bill amount. */
  maxTotal?: number;
  /** Override OT multiplier for a role or band. */
  roleCode?: string;
  otMultiplier?: number;
  adminFeePercent?: number;
}

/** Hybrids — volume discounts, OT rules, NTE caps, pass-through + admin fee. */
export interface HybridParams {
  baseStrategy: Exclude<PricingStrategyType, 'hybrid'>;
  baseParams: Record<string, unknown>;
  rules: HybridRule[];
}

export interface BillRateContext {
  payRate: number;
  burdenedCostPerHour?: number;
  roleCode?: string;
  bandId?: string;
  /** All timesheet lines in the billing period (needed for banded/blended). */
  periodLines?: TimesheetLine[];
}

export interface BillRateResult {
  stBillRate: number;
  otBillRate: number;
  metadata?: Record<string, unknown>;
}

export interface InvoiceContext {
  clientId: string;
  periodStart: string;
  periodEnd: string;
  lines: TimesheetLine[];
  params: Record<string, unknown>;
  /** For temp-to-hire / direct-hire one-off fees. */
  conversionTriggered?: boolean;
  annualSalary?: number;
}

export interface InvoiceResult {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  computedRates: Record<string, unknown>;
}

/** Strategy contract — one implementation per pricing model. */
export interface PricingStrategy {
  readonly type: PricingStrategyType;
  calculateBillRate(ctx: BillRateContext, params: Record<string, unknown>): BillRateResult;
  generateLineItems(ctx: InvoiceContext): InvoiceResult;
}
