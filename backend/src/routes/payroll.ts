import { Router } from 'express';
import { z } from 'zod';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireClientAuth } from '../middleware/auth.js';
import { runPayroll } from '../services/payroll-service.js';
import { store } from '../store/memory-store.js';

const entrySchema = z.object({
  jobId: z.string().uuid(),
  contractorId: z.string().uuid(),
  workDate: z.string(),
  stHours: z.number().min(0),
  otHours: z.number().min(0).default(0),
  payRate: z.number().positive().optional(),
  roleCode: z.string().optional(),
  bandId: z.string().optional(),
});

const runSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  pricingProfileId: z.string().uuid().optional(),
  entries: z.array(entrySchema).min(1),
});

export const payrollRouter = Router();

payrollRouter.use(requireClientAuth);

payrollRouter.get('/history', (req: AuthedRequest, res) => {
  res.json(store.weeklySubmissions.list(req.clientId));
});

payrollRouter.post('/run', (req: AuthedRequest, res) => {
  const parsed = runSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const clientId = req.clientId!;
  const jobs = store.jobs.list(clientId);
  const contractors = store.contractors.list(clientId);
  const profiles = store.pricingProfiles.list(clientId).filter((p) => p.isActive);
  const profile =
    (parsed.data.pricingProfileId && store.pricingProfiles.get(parsed.data.pricingProfileId)) ||
    profiles[0];

  if (!profile || profile.clientId !== clientId) {
    return res.status(400).json({ error: 'No active pricing profile for this client' });
  }

  try {
    const entries = parsed.data.entries.map((e) => {
      const contractor = contractors.find((c) => c.id === e.contractorId);
      const job = jobs.find((j) => j.id === e.jobId);
      if (!contractor) throw new Error(`Unknown contractor: ${e.contractorId}`);
      if (!job) throw new Error(`Unknown job: ${e.jobId}`);

      return store.timesheetEntries.create({
        clientId,
        jobId: e.jobId,
        contractorId: e.contractorId,
        workDate: e.workDate,
        stHours: e.stHours,
        otHours: e.otHours,
        payRate: e.payRate ?? contractor.defaultPayRate ?? 0,
        contractorName: contractor.displayName,
        roleCode: e.roleCode ?? contractor.roleCode,
        bandId: e.bandId,
      });
    });

    const result = runPayroll({ profile, entries, jobs });

    const submission = store.weeklySubmissions.create({
      clientId,
      periodStart: parsed.data.periodStart,
      periodEnd: parsed.data.periodEnd,
      status: 'submitted',
      entryCount: entries.length,
      totalStHours: entries.reduce((s, e) => s + e.stHours, 0),
      totalOtHours: entries.reduce((s, e) => s + e.otHours, 0),
      payrollResult: result,
      submittedAt: new Date().toISOString(),
    });

    res.status(201).json({ submission, payroll: result });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Payroll run failed' });
  }
});
