import type {
  BillRateContext,
  BillRateResult,
  InvoiceContext,
  InvoiceResult,
  PercentageMarkupParams,
  PricingStrategy,
} from '../types.js';
import { buildHourlyLineItems, roundRate } from '../utils.js';

export class PercentageMarkupStrategy implements PricingStrategy {
  readonly type = 'percentage_markup' as const;

  calculateBillRate(ctx: BillRateContext, params: Record<string, unknown>): BillRateResult {
    const p = params as unknown as PercentageMarkupParams;
    const markup = p.markupPercent / 100;
    const stBillRate = roundRate(ctx.payRate * (1 + markup));
    const otMultiplier = p.otMultiplier ?? 1.5;
    const otBillRate = roundRate(stBillRate * otMultiplier);
    return { stBillRate, otBillRate, metadata: { markupPercent: p.markupPercent } };
  }

  generateLineItems(ctx: InvoiceContext): InvoiceResult {
    const params = ctx.params;
    const { lineItems, computedRates } = buildHourlyLineItems(ctx.lines, (line) =>
      this.calculateBillRate({ payRate: line.payRate }, params),
    );
    return { lineItems, subtotal: lineItems.reduce((s, i) => s + i.amount, 0), computedRates };
  }
}

export const percentageMarkupStrategy = new PercentageMarkupStrategy();
