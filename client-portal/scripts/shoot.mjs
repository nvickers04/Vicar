import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'shots');
const tag = process.argv[2] ?? 'state';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'client@acme.com');
await page.fill('input[type=password]', 'demo123');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
await page.goto('http://localhost:3001/timesheets', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.screenshot({ path: path.join(outDir, `${tag}-full.png`), fullPage: true });

console.log('PAGE LOGS:');
console.log(logs.join('\n') || '(none)');
await browser.close();
