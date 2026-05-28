import express from 'express';
import { getCalculationLogs } from './pricing/compliance.js';
import { authRouter } from './routes/auth.js';
import { contractorsRouter } from './routes/contractors.js';
import { invoicesRouter } from './routes/invoices.js';
import { jobsRouter } from './routes/jobs.js';
import { payrollRouter } from './routes/payroll.js';
import { pricingProfilesRouter } from './routes/pricing-profiles.js';
import { timesheetsRouter } from './routes/timesheets.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? 'http://localhost:3001');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    next();
  });

  app.options('*', (_req, res) => res.sendStatus(204));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', subsystem: 'payroll-billing-engine' });
  });

  app.get('/calculation-logs', (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    res.json(getCalculationLogs(clientId));
  });

  app.use('/auth', authRouter);
  app.use('/jobs', jobsRouter);
  app.use('/contractors', contractorsRouter);
  app.use('/payroll', payrollRouter);
  app.use('/pricing-profiles', pricingProfilesRouter);
  app.use('/timesheets', timesheetsRouter);
  app.use('/invoices', invoicesRouter);

  return app;
}
