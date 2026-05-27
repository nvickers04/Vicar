import type {
  BillRateContext,
  BillRateResult,
  InvoiceContext,
  InvoiceResult,
  PricingStrategy,
  TempToHireParams,
} from '../types.js';
import { buildHourlyLineItems, roundMoney, roundRate, subtotalFromLines } from '../utils.js';

/** Temp-to-hire: hourly markup during trial + conversion fee on hire. */
export class TempToHireStrategy implements PricingStrategy {
  readonly type = 'temp_to_hire' as const;

  calculateBillRate(ctx: BillRateContext, params: Record<string, unknown>): BillRateResult {
    const p = params as unknown as TempToHireParams;
    const markup = p.hourlyMarkupPercent / 100;
    const stBillRate = roundRate(ctx.payRate * (1 + markup));
    const otMultiplier = p.otMultiplier ?? 1.5;
    const otBillRate = roundRate(stBillRate * otMultiplier);
    return { stBillRate, otBillRate };
  }

  generateLineItems(ctx: InvoiceContext): InvoiceResult {
    const params = ctx.params as unknown as TempToHireParams;

    if (ctx.conversionTriggered ?? params.conversionTriggered) {
      const lineItems = [
        {
          description: 'Temp-to-hire conversion fee',
          hours: 1,
          hourType: 'FEE' as const,
          payRate: 0,
          billRate: params.conversionFee,
          amount: roundMoney(params.conversionFee),
        },
      ];
      return {
        lineItems,
        subtotal: params.conversionFee,
        computedRates: { conversionFee: params.conversionFee },
      };
    }

    const { lineItems, computedRates } = buildHourlyLineItems(ctx.lines, (line) =>
      this.calculateBillRate({ payRate: line.payRate }, ctx.params),
    );
    return { lineItems, subtotal: subtotalFromLines(lineItems), computedRates };
  }
}

export const tempToHireStrategy = new TempToHireStrategy();
