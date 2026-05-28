import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'shots');
const log = [];
const note = (m) => log.push(m);

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

const dialog = page.locator('[role=dialog]');

// 1) Batch-fill the normal week: all employees, Mon–Fri, 07:00–15:30, 8h
const headChecks = page.locator('thead input[type=checkbox]');
await headChecks.nth(0).check(); // all employees
for (let i = 1; i <= 5; i++) await headChecks.nth(i).check(); // Mon..Fri
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Set start' }).click();
await page.getByRole('button', { name: 'Set end' }).click();
await page.getByRole('button', { name: 'Set hrs' }).click();
await page.waitForTimeout(300);
note('Batch-filled all employees Mon–Fri (07:00–15:30 / 8h)');
await page.getByRole('button', { name: 'Done' }).click(); // clear selection
await page.waitForTimeout(300);

// 2) Maria (row 1, start–end) Wed: overtime day 07:00–18:00 + split two jobs 60/40
await page.locator('tbody tr:nth-child(1) td:nth-child(4) button').click();
await page.waitForTimeout(250);
await dialog.getByLabel('end time').fill('1800');
await dialog.getByLabel('end time').press('Enter');
await page.waitForTimeout(200);
await dialog.getByText('+ Add job').click();
await page.waitForTimeout(200);
await dialog.locator('input[type=range]').fill('60');
await page.waitForTimeout(150);
note('Maria Wed -> 07:00–18:00 (10.5h) split 60/40 across two jobs');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// 3) James (row 2, start+hours) Fri: 10 hours (OT)
await page.locator('tbody tr:nth-child(2) td:nth-child(6) button').click();
await page.waitForTimeout(250);
await dialog.getByLabel('total hours').fill('10');
await dialog.getByLabel('total hours').press('Enter');
await page.waitForTimeout(200);
note('James Fri -> 10h (overtime)');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// 4) Priya (row 3) Fri: day off -> clear the cell
await page.locator('tbody tr:nth-child(3) td:nth-child(6) button').click();
await page.waitForTimeout(250);
const clearBtn = dialog.getByRole('button', { name: 'Clear' });
if (await clearBtn.count()) await clearBtn.click();
await page.waitForTimeout(200);
if ((await dialog.count()) > 0) await page.keyboard.press('Escape');
note('Priya Fri -> day off (cleared)');
await page.waitForTimeout(300);

await shot('test-filled');

// read the per-job totals table
const totalsText = await page.locator('text=Hours by job').locator('xpath=ancestor::div[1]').innerText();
note('TOTALS PANEL:\n' + totalsText);

// 5) Submit
await page.getByRole('button', { name: 'Submit week' }).click();
await page.waitForTimeout(2000);
note('Submitted; now at ' + page.url());
await shot('test-dashboard');

console.log('\n=== SCENARIO ===\n' + log.join('\n'));
console.log('\nCONSOLE ERRORS:', errors.length ? '\n' + errors.join('\n') : '(none)');
await browser.close();
