import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireClientAuth } from '../middleware/auth.js';
import { store } from '../store/memory-store.js';

export const contractorsRouter = Router();

contractorsRouter.use(requireClientAuth);

const DEFAULT_TIME_DEFAULTS = {
  defaultStartTime: '07:00',
  defaultBreakMinutes: 30,
  otRule: 'daily_8' as const,
  defaultEntryMode: 'start_end' as const,
};

function present(c: ReturnType<typeof store.contractors.get>) {
  if (!c) return null;
  return {
    id: c.id,
    clientId: c.clientId,
    displayName: c.displayName,
    roleCode: c.roleCode,
    defaultPayRate: c.defaultPayRate,
    status: c.status ?? 'active',
    timeDefaults: c.timeDefaults ?? DEFAULT_TIME_DEFAULTS,
  };
}

/** List employees (contractors) with time-entry defaults for the logged-in client. */
contractorsRouter.get('/', (req: AuthedRequest, res) => {
  res.json(store.contractors.list(req.clientId).map(present));
});

/** Add a new employee. */
contractorsRouter.post('/', (req: AuthedRequest, res) => {
  const { displayName, roleCode, defaultPayRate, timeDefaults } = req.body ?? {};
  if (!displayName || typeof displayName !== 'string') {
    return res.status(400).json({ error: 'displayName is required' });
  }
  const contractor = store.contractors.create({
    clientId: req.clientId!,
    displayName: displayName.trim(),
    roleCode,
    defaultPayRate: typeof defaultPayRate === 'number' ? defaultPayRate : 20,
    status: 'active',
    timeDefaults: { ...DEFAULT_TIME_DEFAULTS, ...(timeDefaults ?? {}) },
  });
  res.status(201).json(present(contractor));
});

/** Update an employee's name/role/pay/defaults. */
contractorsRouter.patch('/:id', (req: AuthedRequest, res) => {
  const existing = store.contractors.get(req.params.id);
  if (!existing || existing.clientId !== req.clientId) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  const { displayName, roleCode, defaultPayRate, status, timeDefaults } = req.body ?? {};
  const updated = store.contractors.update(req.params.id, {
    ...(displayName !== undefined ? { displayName } : {}),
    ...(roleCode !== undefined ? { roleCode } : {}),
    ...(defaultPayRate !== undefined ? { defaultPayRate } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(timeDefaults !== undefined
      ? { timeDefaults: { ...(existing.timeDefaults ?? DEFAULT_TIME_DEFAULTS), ...timeDefaults } }
      : {}),
  });
  res.json(present(updated));
});

/** Remove an employee. */
contractorsRouter.delete('/:id', (req: AuthedRequest, res) => {
  const existing = store.contractors.get(req.params.id);
  if (!existing || existing.clientId !== req.clientId) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  store.contractors.delete(req.params.id);
  res.status(204).end();
});
