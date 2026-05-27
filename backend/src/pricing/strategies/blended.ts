import type {
  BillRateContext,
  BillRateResult,
  BlendedParams,
  InvoiceContext,
  InvoiceResult,
  PricingStrategy,
} from '../types.js';
import { averagePayRate, buildHourlyLineItems, roundRate, subtotalFromLines } from '../utils.js';

/** Single blended bill rate across all workers in the period. */
export class BlendedStrategy implements PricingStrategy {
  readonly type = 'blended' as const;

  calculateBillRate(ctx: BillRateContext, params: Record<string, unknown>): BillRateResult {
    const p = params as unknown as BlendedParams;
    const blendedPay =
      p.blendedPayRate ?? (ctx.periodLines ? averagePayRate(ctx.periodLines) : ctx.payRate);
    const markup = p.markupPercent / 100;
    const stBillRate = roundRate(blendedPay * (1 + markup));
    const otMultiplier = p.otMultiplier ?? 1.5;
    const otBillRate = roundRate(stBillRate * otMultiplier);
    return { stBillRate, otBillRate, metadata: { blendedPayRate: blendedPay } };
  }

  generateLineItems(ctx: InvoiceContext): InvoiceResult {
    const params = ctx.params;
    const rates = this.calculateBillRate({ payRate: 0, periodLines: ctx.lines }, params);

    const { lineItems, computedRates } = buildHourlyLineItems(ctx.lines, () => ({
      stBillRate: rates.stBillRate,
      otBillRate: rates.otBillRate,
      meta: rates.metadata,
    }));

    return { lineItems, subtotal: subtotalFromLines(lineItems), computedRates };
  }
}

export const blendedStrategy = new BlendedStrategy();
