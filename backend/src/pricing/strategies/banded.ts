import type {
  BillRateContext,
  BillRateResult,
  BandedParams,
  InvoiceContext,
  InvoiceResult,
  PricingStrategy,
} from '../types.js';
import {
  averagePayRate,
  buildHourlyLineItems,
  linesInBand,
  resolveBandForPayRate,
  roundRate,
  subtotalFromLines,
} from '../utils.js';

/**
 * Banded / tiered pricing — matches pricing-strategy.md:
 * Band_ST_Bill = Band_Actual_Average_Pay × ST_Multiplier
 * Band_OT_Bill = Band_ST_Bill × OT_Multiplier
 */
export class BandedStrategy implements PricingStrategy {
  readonly type = 'banded' as const;

  private bandRates(
    bandId: string,
    periodLines: BillRateContext['periodLines'],
    params: BandedParams,
  ): BillRateResult {
    const band = params.bands.find((b) => b.bandId === bandId);
    if (!band) throw new Error(`Unknown band: ${bandId}`);

    const bandLines = linesInBand(periodLines ?? [], bandId);
    const avgPay = averagePayRate(bandLines);
    const stBillRate = roundRate(avgPay * band.stMultiplier);
    const otBillRate = roundRate(stBillRate * band.otMultiplier);

    return {
      stBillRate,
      otBillRate,
      metadata: {
        bandId,
        averagePayRate: avgPay,
        stMultiplier: band.stMultiplier,
        otMultiplier: band.otMultiplier,
      },
    };
  }

  calculateBillRate(ctx: BillRateContext, params: Record<string, unknown>): BillRateResult {
    const p = params as unknown as BandedParams;
    const bandId =
      ctx.bandId ??
      resolveBandForPayRate(ctx.payRate, p.bands) ??
      (() => {
        throw new Error(`Pay rate ${ctx.payRate} does not fall in any configured band`);
      })();

    return this.bandRates(bandId, ctx.periodLines, p);
  }

  generateLineItems(ctx: InvoiceContext): InvoiceResult {
    const params = ctx.params as unknown as BandedParams;
    const bandIds = new Set(
      ctx.lines.map(
        (l) => l.bandId ?? resolveBandForPayRate(l.payRate, params.bands) ?? 'unknown',
      ),
    );

    const bandRateCache = new Map<string, BillRateResult>();
    for (const bandId of bandIds) {
      if (bandId === 'unknown') continue;
      bandRateCache.set(bandId, this.bandRates(bandId, ctx.lines, params));
    }

    const { lineItems, computedRates } = buildHourlyLineItems(ctx.lines, (line) => {
      const bandId =
        line.bandId ?? resolveBandForPayRate(line.payRate, params.bands) ?? 'unknown';
      const rates = bandRateCache.get(bandId);
      if (!rates) throw new Error(`No rates for band ${bandId}`);
      return { stBillRate: rates.stBillRate, otBillRate: rates.otBillRate, meta: rates.metadata };
    });

    for (const [bandId, rates] of bandRateCache) {
      computedRates[`band:${bandId}`] = rates.metadata;
    }

    return { lineItems, subtotal: subtotalFromLines(lineItems), computedRates };
  }
}

export const bandedStrategy = new BandedStrategy();
