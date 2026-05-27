import { Router } from 'express';
import { z } from 'zod';
import { calculateBillRate } from '../pricing/engine.js';
import { store } from '../store/memory-store.js';
import type { PricingStrategyType } from '../types/index.js';

const strategyTypes = [
  'percentage_markup',
  'burdened_markup',
  'rate_card',
  'banded',
  'blended',
  'fixed_fee',
  'temp_to_hire',
  'direct_hire',
  'hybrid',
] as const;

const profileSchema = z.object({
  clientId: z.string().uuid(),
  contractRef: z.string().optional(),
  name: z.string().min(1),
  strategyType: z.enum(strategyTypes),
  params: z.record(z.unknown()),
  marginMinPercent: z.number().default(34),
  marginMaxPercent: z.number().default(40),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
});

const previewSchema = z.object({
  payRate: z.number().positive(),
  burdenedCostPerHour: z.number().optional(),
  roleCode: z.string().optional(),
  bandId: z.string().optional(),
  periodLines: z.array(z.record(z.unknown())).optional(),
});

export const pricingProfilesRouter = Router();

pricingProfilesRouter.get('/', (req, res) => {
  const clientId = req.query.clientId as string | undefined;
  res.json(store.pricingProfiles.list(clientId));
});

pricingProfilesRouter.get('/:id', (req, res) => {
  const profile = store.pricingProfiles.get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Pricing profile not found' });
  res.json(profile);
});

pricingProfilesRouter.post('/', (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const profile = store.pricingProfiles.create({
    ...parsed.data,
    strategyType: parsed.data.strategyType as PricingStrategyType,
    effectiveFrom: parsed.data.effectiveFrom ?? new Date().toISOString().slice(0, 10),
  });
  res.status(201).json(profile);
});

pricingProfilesRouter.put('/:id', (req, res) => {
  const parsed = profileSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = store.pricingProfiles.update(req.params.id, parsed.data);
  if (!updated) return res.status(404).json({ error: 'Pricing profile not found' });
  res.json(updated);
});

pricingProfilesRouter.delete('/:id', (req, res) => {
  const deleted = store.pricingProfiles.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Pricing profile not found' });
  res.status(204).send();
});

/** Preview bill rates without persisting an invoice. */
pricingProfilesRouter.post('/:id/calculate', (req, res) => {
  const profile = store.pricingProfiles.get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Pricing profile not found' });

  const parsed = previewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = calculateBillRate({
      profile,
      payRate: parsed.data.payRate,
      burdenedCostPerHour: parsed.data.burdenedCostPerHour,
      roleCode: parsed.data.roleCode,
      bandId: parsed.data.bandId,
      periodLines: parsed.data.periodLines as Parameters<typeof calculateBillRate>[0]['periodLines'],
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Calculation failed' });
  }
});
