import type { PricingStrategyType } from '../types/index.js';
import type { PricingStrategy } from './types.js';
import { percentageMarkupStrategy } from './strategies/percentage-markup.js';
import { burdenedMarkupStrategy } from './strategies/burdened-markup.js';
import { rateCardStrategy } from './strategies/rate-card.js';
import { bandedStrategy } from './strategies/banded.js';
import { blendedStrategy } from './strategies/blended.js';
import { fixedFeeStrategy } from './strategies/fixed-fee.js';
import { tempToHireStrategy } from './strategies/temp-to-hire.js';
import { directHireStrategy } from './strategies/direct-hire.js';
import { hybridStrategy } from './strategies/hybrid.js';

const strategies: Record<PricingStrategyType, PricingStrategy> = {
  percentage_markup: percentageMarkupStrategy,
  burdened_markup: burdenedMarkupStrategy,
  rate_card: rateCardStrategy,
  banded: bandedStrategy,
  blended: blendedStrategy,
  fixed_fee: fixedFeeStrategy,
  temp_to_hire: tempToHireStrategy,
  direct_hire: directHireStrategy,
  hybrid: hybridStrategy,
};

export function getRawStrategy(type: PricingStrategyType): PricingStrategy {
  const strategy = strategies[type];
  if (!strategy) throw new Error(`Unknown pricing strategy: ${type}`);
  return strategy;
}
