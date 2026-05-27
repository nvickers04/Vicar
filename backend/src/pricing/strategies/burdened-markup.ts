import type {
  BillRateContext,
  BillRateResult,
  BurdenedMarkupParams,
  InvoiceContext,
  InvoiceResult,
  PricingStrategy,
} from '../types.js';
import { buildHourlyLineItems, roundRate } from '../utils.js';

export class BurdenedMarkupStrategy implements PricingStrategy {
  readonly type = 'burdened_markup' as const;

  private burdenedCost(ctx: BillRateContext, params: BurdenedMarkupParams): number {
    if (ctx.burdenedCostPerHour !== undefined) return ctx.burdenedCostPerHour;
    const multiplier = params.burdenMultiplier ?? 1.35;
    return roundRate(ctx.payRate * multiplier);
  }

  calculateBillRate(ctx: BillRateContext, params: Record<string, unknown>): BillRateResult {
    const p = params as unknown as BurdenedMarkupParams;
    const burdened = this.burdenedCost(ctx, p);
    const markup = p.markupPercent / 100;
    const stBillRate = roundRate(burdened * (1 + markup));
    const otMultiplier = p.otMultiplier ?? 1.5;
    const otBillRate = roundRate(stBillRate * otMultiplier);
    return { stBillRate, otBillRate, metadata: { burdenedCost: burdened } };
  }

  generateLineItems(ctx: InvoiceContext): InvoiceResult {
    const params = ctx.params;
    const { lineItems, computedRates } = buildHourlyLineItems(ctx.lines, (line) =>
      this.calculateBillRate(
        { payRate: line.payRate, burdenedCostPerHour: line.burdenedCostPerHour },
        params,
      ),
    );
    return { lineItems, subtotal: lineItems.reduce((s, i) => s + i.amount, 0), computedRates };
  }
}

export const burdenedMarkupStrategy = new BurdenedMarkupStrategy();
