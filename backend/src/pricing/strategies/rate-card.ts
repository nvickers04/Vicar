import type {
  BillRateContext,
  BillRateResult,
  InvoiceContext,
  InvoiceResult,
  PricingStrategy,
  RateCardParams,
} from '../types.js';
import { buildHourlyLineItems, roundRate } from '../utils.js';

export class RateCardStrategy implements PricingStrategy {
  readonly type = 'rate_card' as const;

  calculateBillRate(ctx: BillRateContext, params: Record<string, unknown>): BillRateResult {
    const p = params as unknown as RateCardParams;
    const entry = p.rates.find((r) => r.roleCode === ctx.roleCode);
    if (!entry) {
      throw new Error(`No rate card entry for role: ${ctx.roleCode ?? 'unknown'}`);
    }
    const defaultOt = p.defaultOtMultiplier ?? 1.5;
    const stBillRate = roundRate(entry.stBillRate);
    const otBillRate = roundRate(entry.otBillRate ?? stBillRate * defaultOt);
    return { stBillRate, otBillRate, metadata: { roleCode: ctx.roleCode } };
  }

  generateLineItems(ctx: InvoiceContext): InvoiceResult {
    const params = ctx.params;
    const { lineItems, computedRates } = buildHourlyLineItems(ctx.lines, (line) =>
      this.calculateBillRate({ payRate: line.payRate, roleCode: line.roleCode }, params),
    );
    return { lineItems, subtotal: lineItems.reduce((s, i) => s + i.amount, 0), computedRates };
  }
}

export const rateCardStrategy = new RateCardStrategy();
