import express from 'express';
import { getCalculationLogs } from './pricing/compliance.js';
import { invoicesRouter } from './routes/invoices.js';
import { pricingProfilesRouter } from './routes/pricing-profiles.js';
import { timesheetsRouter } from './routes/timesheets.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', subsystem: 'payroll-billing-engine' });
  });

  app.get('/calculation-logs', (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    res.json(getCalculationLogs(clientId));
  });

  app.use('/pricing-profiles', pricingProfilesRouter);
  app.use('/timesheets', timesheetsRouter);
  app.use('/invoices', invoicesRouter);

  return app;
}
