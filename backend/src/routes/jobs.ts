import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireClientAuth } from '../middleware/auth.js';
import { store } from '../store/memory-store.js';

export const jobsRouter = Router();

jobsRouter.use(requireClientAuth);

jobsRouter.get('/', (req: AuthedRequest, res) => {
  const jobs = store.jobs.list(req.clientId).filter((j) => j.status !== 'void');
  res.json(jobs);
});

jobsRouter.get('/:id', (req: AuthedRequest, res) => {
  const job = store.jobs.get(req.params.id);
  if (!job || job.clientId !== req.clientId) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

/** Create a new job number. */
jobsRouter.post('/', (req: AuthedRequest, res) => {
  const { jobNumber, name } = req.body ?? {};
  if (!jobNumber || typeof jobNumber !== 'string') {
    return res.status(400).json({ error: 'jobNumber is required' });
  }
  const exists = store.jobs
    .list(req.clientId)
    .some((j) => j.status !== 'void' && j.jobNumber.toLowerCase() === jobNumber.trim().toLowerCase());
  if (exists) {
    return res.status(409).json({ error: 'A job with that number already exists' });
  }
  const job = store.jobs.create({
    clientId: req.clientId!,
    jobNumber: jobNumber.trim(),
    name: name?.trim() || undefined,
    status: 'active',
  });
  res.status(201).json(job);
});

/** Edit a job's number/name/status. */
jobsRouter.patch('/:id', (req: AuthedRequest, res) => {
  const existing = store.jobs.get(req.params.id);
  if (!existing || existing.clientId !== req.clientId) {
    return res.status(404).json({ error: 'Job not found' });
  }
  const { jobNumber, name, status } = req.body ?? {};
  const updated = store.jobs.update(req.params.id, {
    ...(jobNumber !== undefined ? { jobNumber: String(jobNumber).trim() } : {}),
    ...(name !== undefined ? { name: name?.trim() || undefined } : {}),
    ...(status !== undefined ? { status } : {}),
  });
  res.json(updated);
});

/** Remove (void) a job. Soft-delete so historical invoices keep their reference. */
jobsRouter.delete('/:id', (req: AuthedRequest, res) => {
  const existing = store.jobs.get(req.params.id);
  if (!existing || existing.clientId !== req.clientId) {
    return res.status(404).json({ error: 'Job not found' });
  }
  store.jobs.update(req.params.id, { status: 'void' });
  res.status(204).end();
});
