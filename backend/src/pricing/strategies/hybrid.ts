import type {
  BillRateContext,
  BillRateResult,
  HybridParams,
  InvoiceContext,
  InvoiceResult,
  PricingStrategy,
} from '../types.js';
import { roundMoney, subtotalFromLines } from '../utils.js';
import { getRawStrategy } from '../registry.js';

/** Applies hybrid rules (volume discount, OT override, NTE cap, pass-through admin) on top of a base strategy. */
export class HybridStrategy implements PricingStrategy {
  readonly type = 'hybrid' as const;

  generateLineItems(ctx: InvoiceContext): InvoiceResult {
    const params = ctx.params as unknown as HybridParams;
    const baseStrategy = getRawStrategy(params.baseStrategy);
    let result = baseStrategy.generateLineItems({
      ...ctx,
      params: params.baseParams,
    });

    const totalHours = ctx.lines.reduce((s, l) => s + l.stHours + l.otHours, 0);

    for (const rule of params.rules) {
      if (rule.type === 'volume_discount' && rule.minHours && totalHours >= rule.minHours) {
        const discount = (rule.discountPercent ?? 0) / 100;
        result.lineItems = result.lineItems.map((item) => {
          const amount = roundMoney(item.amount * (1 - discount));
          return { ...item, amount, billRate: roundMoney(item.billRate * (1 - discount)) };
        });
        result.subtotal = subtotalFromLines(result.lineItems);
        result.computedRates.volumeDiscount = { discountPercent: rule.discountPercent, totalHours };
      }

      if (rule.type === 'ot_override' && rule.otMultiplier) {
        result.lineItems = result.lineItems.map((item) => {
          if (item.hourType !== 'OT') return item;
          if (rule.roleCode && item.roleCode !== rule.roleCode) return item;
          const amount = roundMoney(item.hours * item.payRate * rule.otMultiplier!);
          return {
            ...item,
            billRate: roundMoney(item.payRate * rule.otMultiplier!),
            amount,
          };
        });
        result.subtotal = subtotalFromLines(result.lineItems);
      }

      if (rule.type === 'not_to_exceed' && rule.maxTotal && result.subtotal > rule.maxTotal) {
        const scale = rule.maxTotal / result.subtotal;
        result.lineItems = result.lineItems.map((item) => ({
          ...item,
          amount: roundMoney(item.amount * scale),
          billRate: roundMoney(item.billRate * scale),
        }));
        result.subtotal = rule.maxTotal;
        result.computedRates.notToExceed = { maxTotal: rule.maxTotal, scaled: true };
      }

      if (rule.type === 'pass_through_admin' && rule.adminFeePercent) {
        const passThrough = ctx.lines.reduce((s, l) => s + (l.burdenedCostPerHour ?? 0) * (l.stHours + l.otHours), 0);
        if (passThrough > 0) {
          const adminFee = roundMoney(passThrough * (rule.adminFeePercent / 100));
          result.lineItems.push({
            description: 'Pass-through + admin fee',
            hours: 1,
            hourType: 'PASS_THROUGH',
            payRate: passThrough,
            billRate: roundMoney(passThrough + adminFee),
            amount: roundMoney(passThrough + adminFee),
          });
          result.subtotal = subtotalFromLines(result.lineItems);
        }
      }
    }

    return result;
  }

  calculateBillRate(_ctx: BillRateContext, _params: Record<string, unknown>): BillRateResult {
    throw new Error('Hybrid strategy requires generateLineItems — use /invoices/generate or preview');
  }
}

export const hybridStrategy = new HybridStrategy();
