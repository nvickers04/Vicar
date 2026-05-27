import { Router } from 'express';
import { z } from 'zod';
import { createInvoiceNumber, generateInvoice } from '../pricing/engine.js';
import { store } from '../store/memory-store.js';

const generateSchema = z.object({
  timesheetId: z.string().uuid(),
  pricingProfileId: z.string().uuid(),
  conversionTriggered: z.boolean().optional(),
  annualSalary: z.number().optional(),
});

export const invoicesRouter = Router();

invoicesRouter.get('/', (req, res) => {
  const clientId = req.query.clientId as string | undefined;
  res.json(store.invoices.list(clientId));
});

invoicesRouter.get('/:id', (req, res) => {
  const invoice = store.invoices.get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const snapshot = store.rateSnapshots.get(invoice.rateSnapshotId);
  res.json({ ...invoice, rateSnapshot: snapshot });
});

invoicesRouter.post('/generate', (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const timesheet = store.timesheets.get(parsed.data.timesheetId);
  if (!timesheet) return res.status(404).json({ error: 'Timesheet not found' });

  const profile = store.pricingProfiles.get(parsed.data.pricingProfileId);
  if (!profile) return res.status(404).json({ error: 'Pricing profile not found' });

  try {
    const { invoice, rateSnapshot } = generateInvoice({
      profile,
      timesheet,
      conversionTriggered: parsed.data.conversionTriggered,
      annualSalary: parsed.data.annualSalary,
    });

    const savedSnapshot = store.rateSnapshots.create(rateSnapshot);
    const savedInvoice = store.invoices.create({
      ...invoice,
      rateSnapshotId: savedSnapshot.id,
      invoiceNumber: createInvoiceNumber(),
    });

    store.timesheets.update(timesheet.id, { status: 'invoiced' });

    res.status(201).json({ ...savedInvoice, rateSnapshot: savedSnapshot });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Invoice generation failed' });
  }
});
