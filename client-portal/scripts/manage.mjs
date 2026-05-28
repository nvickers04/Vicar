import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'shots');
const results = [];
const check = (n, ok, d = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`);
const step = async (n, fn) => {
  try {
    await fn();
  } catch (e) {
    check(n, false, 'threw: ' + e.message.split('\n')[0]);
  }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
const shot = (n) => page.screenshot({ path: path.join(outDir, `${n}.png`), fullPage: true });
const uniq = Date.now().toString().slice(-5);

await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'client@acme.com');
await page.fill('input[type=password]', 'demo123');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});

// ---- EMPLOYEES PAGE ----
await step('employees page loads', async () => {
  await page.getByRole('link', { name: 'Employees' }).first().click();
  await page.waitForURL('**/employees', { timeout: 10000 });
  await page.waitForTimeout(1000);
  const rows = await page.locator('tbody tr').count();
  check('employee rows render', rows > 0, `${rows} rows`);
  await shot('m1-employees');
});

await step('edit a default start time (text)', async () => {
  const first = page.locator('tbody tr').first();
  const startField = first.locator('input[aria-label*="default start"]');
  await startField.click();
  await startField.fill('815');
  await startField.press('Enter');
  await page.waitForTimeout(600);
  const val = await startField.inputValue();
  check('typed "815" -> formatted start', /8:15|08:15/.test(val), val);
});

await step('toggle status active/inactive', async () => {
  const first = page.locator('tbody tr').first();
  const badge = first.getByRole('button', { name: /Active|Inactive/ });
  const before = (await badge.innerText()).trim();
  await badge.click();
  await page.waitForTimeout(600);
  const after = (await badge.innerText()).trim();
  check('status toggles', before !== after, `${before} -> ${after}`);
  // toggle back to active
  if (after === 'Inactive') {
    await badge.click();
    await page.waitForTimeout(400);
  }
});

await step('metrics columns present', async () => {
  const head = await page.locator('thead').innerText();
  check('has ST/OT, Weeks, Payout columns', /ST.*OT/i.test(head) && /Weeks/i.test(head) && /Payout/i.test(head), head.replace(/\s+/g, ' '));
});

let empCountBefore = 0;
await step('add + remove employee', async () => {
  empCountBefore = await page.locator('tbody tr').count();
  await page.getByPlaceholder('New employee name').fill(`Test Person ${uniq}`);
  await page.getByRole('button', { name: 'Add employee' }).click();
  await page.waitForTimeout(700);
  const afterAdd = await page.locator('tbody tr').count();
  check('employee added', afterAdd === empCountBefore + 1, `${empCountBefore} -> ${afterAdd}`);

  const newRow = page.locator('tbody tr').last();
  await newRow.getByRole('button', { name: 'Remove' }).click();
  await page.waitForTimeout(700);
  const afterRemove = await page.locator('tbody tr').count();
  check('employee removed', afterRemove === empCountBefore, `-> ${afterRemove}`);
});

// ---- JOBS PAGE ----
await step('jobs page loads', async () => {
  await page.getByRole('link', { name: 'Jobs' }).first().click();
  await page.waitForURL('**/jobs', { timeout: 10000 });
  await page.waitForTimeout(1000);
  const rows = await page.locator('tbody tr').count();
  check('job rows render', rows > 0, `${rows} rows`);
  await shot('m2-jobs');
});

await step('jobs metrics columns present', async () => {
  const head = await page.locator('thead').innerText();
  check('has Invoiced + Last used columns', /Invoiced/i.test(head) && /Last used/i.test(head), head.replace(/\s+/g, ' '));
});

let jobCountBefore = 0;
await step('add + remove job', async () => {
  jobCountBefore = await page.locator('tbody tr').count();
  await page.getByPlaceholder('Job # (e.g. 1042)').fill(`QA-${uniq}`);
  await page.getByPlaceholder('Name (optional)').fill('QA Test Job');
  await page.getByRole('button', { name: 'Add job' }).click();
  await page.waitForTimeout(700);
  const afterAdd = await page.locator('tbody tr').count();
  check('job added', afterAdd === jobCountBefore + 1, `${jobCountBefore} -> ${afterAdd}`);

  const newJobRow = page.locator('tbody tr').last();
  await newJobRow.getByRole('button', { name: 'Remove' }).click();
  await page.waitForTimeout(700);
  const afterRemove = await page.locator('tbody tr').count();
  check('job removed', afterRemove === jobCountBefore, `-> ${afterRemove}`);
});

// ---- TIMESHEET still works + sidebar links ----
await step('timesheet sidebar has manage links', async () => {
  await page.goto('http://localhost:3001/timesheets', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const aside = page.locator('aside');
  check('Employees link in sidebar', (await aside.getByRole('link', { name: 'Employees' }).count()) === 1);
  check('Jobs link in sidebar', (await aside.getByRole('link', { name: 'Job numbers' }).count()) === 1);
  await shot('m3-timesheet-sidebar');
});

check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
console.log('\n' + results.join('\n') + '\n');
const failed = results.filter((r) => r.startsWith('FAIL'));
console.log(failed.length ? `${failed.length} FAILED` : 'ALL PASSED');
process.exit(failed.length ? 1 : 0);
