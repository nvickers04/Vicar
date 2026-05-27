import type { InvoiceLineItem } from '../../types/index.js';
import type {
  BillRateContext,
  BillRateResult,
  FixedFeeParams,
  InvoiceContext,
  InvoiceResult,
  PricingStrategy,
} from '../types.js';
import { roundMoney } from '../utils.js';

/** Fixed fee / project-based / SOW billing. */
export class FixedFeeStrategy implements PricingStrategy {
  readonly type = 'fixed_fee' as const;

  calculateBillRate(_ctx: BillRateContext, _params: Record<string, unknown>): BillRateResult {
    return { stBillRate: 0, otBillRate: 0, metadata: { note: 'Fixed fee — use generateLineItems' } };
  }

  generateLineItems(ctx: InvoiceContext): InvoiceResult {
    const params = ctx.params as unknown as FixedFeeParams;
    const lineItems: InvoiceLineItem[] = [
      {
        description: params.description,
        hours: 1,
        hourType: 'FEE' as const,
        payRate: 0,
        billRate: params.feeAmount,
        amount: roundMoney(params.feeAmount),
      },
    ];

    if (params.passThroughAmount && params.passThroughAmount > 0) {
      const adminPct = (params.adminFeePercent ?? 0) / 100;
      const adminFee = roundMoney(params.passThroughAmount * adminPct);
      lineItems.push({
        description: 'Pass-through costs',
        hours: 1,
        hourType: 'PASS_THROUGH' as const,
        payRate: params.passThroughAmount,
        billRate: params.passThroughAmount,
        amount: roundMoney(params.passThroughAmount),
      });
      if (adminFee > 0) {
        lineItems.push({
          description: 'Admin fee on pass-through',
          hours: 1,
          hourType: 'FEE' as const,
          payRate: 0,
          billRate: adminFee,
          amount: adminFee,
        });
      }
    }

    const subtotal = roundMoney(lineItems.reduce((s, i) => s + i.amount, 0));
    return {
      lineItems,
      subtotal,
      computedRates: { feeAmount: params.feeAmount, description: params.description },
    };
  }
}

export const fixedFeeStrategy = new FixedFeeStrategy();
