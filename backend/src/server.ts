import { createApp } from './app.js';
import { seedDemoData } from './seed/demo-data.js';

const PORT = Number(process.env.PORT ?? 3000);

seedDemoData();

const app = createApp();

app.listen(PORT, () => {
  console.log(`Vicar Payroll / Billing Engine listening on http://localhost:${PORT}`);
});
