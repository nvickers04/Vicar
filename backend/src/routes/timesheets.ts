import { Router } from 'express';
import { z } from 'zod';
import { store } from '../store/memory-store.js';

const lineSchema = z.object({
  contractorId: z.string().uuid(),
  contractorName: z.string().optional(),
  roleCode: z.string().optional(),
  payRate: z.number().positive(),
  stHours: z.number().min(0),
  otHours: z.number().min(0).default(0),
  burdenedCostPerHour: z.number().optional(),
  bandId: z.string().optional(),
});

const timesheetSchema = z.object({
  clientId: z.string().uuid(),
  contractorId: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
  status: z.enum(['draft', 'submitted', 'approved', 'invoiced', 'void']).default('submitted'),
  lines: z.array(lineSchema).min(1),
  notes: z.string().optional(),
});

export const timesheetsRouter = Router();

timesheetsRouter.get('/', (req, res) => {
  const clientId = req.query.clientId as string | undefined;
  res.json(store.timesheets.list(clientId));
});

timesheetsRouter.get('/:id', (req, res) => {
  const ts = store.timesheets.get(req.params.id);
  if (!ts) return res.status(404).json({ error: 'Timesheet not found' });
  res.json(ts);
});

timesheetsRouter.post('/', (req, res) => {
  const parsed = timesheetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const ts = store.timesheets.create(parsed.data);
  res.status(201).json(ts);
});
