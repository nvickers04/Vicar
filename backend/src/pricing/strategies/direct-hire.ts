import type {
  BillRateContext,
  BillRateResult,
  DirectHireParams,
  InvoiceContext,
  InvoiceResult,
  PricingStrategy,
} from '../types.js';
import { roundMoney } from '../utils.js';

/** Direct-hire placement fee (one-time). */
export class DirectHireStrategy implements PricingStrategy {
  readonly type = 'direct_hire' as const;

  calculateBillRate(_ctx: BillRateContext, _params: Record<string, unknown>): BillRateResult {
    return { stBillRate: 0, otBillRate: 0, metadata: { note: 'Direct hire — use generateLineItems' } };
  }

  generateLineItems(ctx: InvoiceContext): InvoiceResult {
    const params = ctx.params as unknown as DirectHireParams;
    let fee = params.flatFee ?? 0;

    if (params.placementFeePercent && ctx.annualSalary) {
      fee = roundMoney(ctx.annualSalary * (params.placementFeePercent / 100));
    }

    if (fee <= 0) {
      throw new Error('Direct hire fee requires flatFee or placementFeePercent + annualSalary');
    }

    const lineItems = [
      {
        description: 'Direct-hire placement fee',
        hours: 1,
        hourType: 'FEE' as const,
        payRate: 0,
        billRate: fee,
        amount: fee,
      },
    ];

    return {
      lineItems,
      subtotal: fee,
      computedRates: {
        flatFee: params.flatFee,
        placementFeePercent: params.placementFeePercent,
        annualSalary: ctx.annualSalary,
        computedFee: fee,
      },
    };
  }
}

export const directHireStrategy = new DirectHireStrategy();
