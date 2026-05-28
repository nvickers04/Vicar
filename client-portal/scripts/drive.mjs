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

await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'client@acme.com');
await page.fill('input[type=password]', 'demo123');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
await page.goto('http://localhost:3001/timesheets', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot('n1-empty-grid');

const dialog = page.locator('[role=dialog]');
const monCell = page.locator('tbody tr:first-child td:nth-child(2) button').first();

await step('cells empty by default', async () => {
  const txt = await page.locator('tbody tr:first-child td:nth-child(2)').innerText();
  check('MON cell starts empty (no hours)', !/\dh|\d\.\d/.test(txt), JSON.stringify(txt));
});

await step('text time entry + break + jobs', async () => {
  await monCell.click();
  await page.waitForTimeout(300);
  check('editor opens', (await dialog.count()) === 1);

  // type end time as plain text
  await dialog.getByLabel('end time').fill('1700');
  await dialog.getByLabel('end time').press('Enter');
  await page.waitForTimeout(300);
  const hrs = await dialog.locator('text=/\\d+(\\.\\d+)?h/').first().innerText();
  check('typed "1700" -> hours computed', /10/.test(hrs), hrs);

  // per-cell break field exists and editable
  check('per-cell break field present', (await dialog.getByLabel('break minutes').count()) === 1);
  await dialog.getByLabel('break minutes').fill('0');
  await dialog.getByLabel('break minutes').press('Enter');
  await page.waitForTimeout(300);
  const hrs2 = await dialog.locator('text=/\\d+(\\.\\d+)?h/').first().innerText();
  check('break edit changes hours (10 -> 10.5)', /10\.5/.test(hrs2), hrs2);

  await dialog.getByText('+ Add job').click();
  await page.waitForTimeout(300);
  check('2-job slider appears', (await dialog.locator('input[type=range]').count()) === 1);
  await shot('n2-editor');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('Escape closes', (await dialog.count()) === 0);
});

await step('add employee', async () => {
  const before = await page.locator('tbody tr').count();
  await page.getByPlaceholder('New employee name').fill('Dana Quinn');
  await page.getByPlaceholder('New employee name').press('Enter');
  await page.waitForTimeout(600);
  const after = await page.locator('tbody tr').count();
  check('employee added to grid', after === before + 1, `${before} -> ${after}`);
});

await step('add job', async () => {
  const before = await page.locator('aside [aria-label="Job number"]').count();
  await page.getByPlaceholder('JOB-####').fill('JOB-2099');
  await page.getByPlaceholder('name (optional)').fill('Night shift');
  await page.getByPlaceholder('JOB-####').press('Enter');
  await page.waitForTimeout(600);
  const after = await page.locator('aside [aria-label="Job number"]').count();
  check('job added to list', after === before + 1, `${before} -> ${after}`);
});

await step('apply settings to selected', async () => {
  await page.locator('tbody tr:first-child input[type=checkbox]').first().check();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /Apply settings/ }).click();
  await page.waitForTimeout(400);
  check('apply settings shows confirmation', (await page.getByText(/Settings applied/).count()) >= 1);
  await page.locator('tbody tr:first-child input[type=checkbox]').first().uncheck();
});

await step('ST/OT totals panel', async () => {
  const hasPanel = (await page.getByText('Hours by job').count()) >= 1;
  check('totals panel renders', hasPanel);
  await shot('n3-totals');
});

await step('submit week', async () => {
  await page.getByRole('button', { name: 'Submit week' }).click();
  await page.waitForTimeout(1800);
  check('submit -> dashboard', page.url().includes('/dashboard'), page.url());
  await shot('n4-after-submit');
});

console.log('\n=== RESULTS ===\n' + results.join('\n'));
console.log('\nCONSOLE ERRORS:', errors.length ? '\n' + errors.join('\n') : '(none)');
await browser.close();
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
