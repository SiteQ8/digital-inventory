// A walk through the page in a real browser, in both languages, on a desktop and a phone.
// Development only: it needs Playwright, which the tool itself never uses.
//   node scripts/ui.mjs [folder for the pictures]

import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const DOCS = new URL('../docs/', import.meta.url).pathname;
const OUT = process.argv[2] || 'shots';
const TYPES = { '.webmanifest': 'application/manifest+json', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(DOCS, path.endsWith('/') ? `${path}index.html` : path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'text/html' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}/`;
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const problems = [];
const note = (where, what) => problems.push(`${where}: ${what}`);

for (const lang of ['ar', 'en']) {
  for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
    const tag = `${lang}-${name}`;
    const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true });
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') note(tag, `console ${m.text()}`); });
    page.on('pageerror', (e) => note(tag, `error ${e.message}`));
    page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('blob:')) note(tag, `request ${r.url()}`); });
    page.on('dialog', (d) => d.accept());

    const overflow = async (view) => {
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (wide > 0) note(tag, `${view} is ${wide}px wider than the screen`);
    };
    const shot = (view) => page.screenshot({ path: join(OUT, `${tag}-${view}.png`), fullPage: true });

    await page.goto(`${base}?lang=${lang}`);
    await page.evaluate(() => document.fonts.ready);
    if (await page.getAttribute('html', 'dir') !== (lang === 'ar' ? 'rtl' : 'ltr')) note(tag, 'wrong direction');
    await overflow('empty'); await shot('empty');

    await page.click('#tabs a[data-view="people"]');
    await page.fill('#p-name', lang === 'ar' ? 'سارة' : 'Sara');
    await page.fill('#p-relation', lang === 'ar' ? 'الزوجة' : 'Wife');
    await page.fill('#p-contact', 'sara@example.org');
    await page.click('.person-form button');
    if (await page.locator('.people li').count() !== 1) note(tag, 'the recipient was not added');
    await overflow('people'); await shot('people');

    await page.click('#tabs a[data-view="assets"]');
    await page.click('.add-items button >> nth=0');
    await page.click('.add-items button >> nth=11');
    const first = await page.locator('.row').first().getAttribute('id');
    const id = first.replace('row-', '');
    await page.fill(`#${id}-label`, lang === 'ar' ? 'الحساب الشخصي' : 'Personal account');
    await page.fill(`#${id}-account`, 'owner@example.org');
    await page.fill(`#${id}-where`, 'password: hunter2secret');
    if (!(await page.locator(`#${id}-where-warn`).isVisible())) note(tag, 'a typed secret raised no warning');
    await page.fill(`#${id}-where`, lang === 'ar' ? 'في ظرف مغلق داخل خزنة البيت' : 'In a sealed envelope in the home safe');
    await page.locator(`#${id}-where`).blur();
    await page.selectOption(`#${id}-recipient`, { index: 1 });
    await page.selectOption(`#${id}-action`, 'handover');
    for (const box of await page.locator(`#row-${id} .steps input`).all()) await box.check();
    if (!(await page.locator(`#row-${id} .row-state.done`).count())) note(tag, 'a finished asset is not shown as complete');
    if (await page.inputValue(`#${id}-account`) !== 'owner@example.org') note(tag, 'typed text was lost by the click after it');
    if (!(await page.locator(`#row-${id} .row-account`).textContent()).includes('owner@example.org')) note(tag, 'the line does not show the identifier');
    await overflow('assets'); await shot('assets');

    const small = await page.evaluate(() => [...document.querySelectorAll('button, #tabs a, summary, select, input:not([type=checkbox])')]
      .filter((el) => el.offsetParent && el.getBoundingClientRect().height < 43.5).map((el) => el.id || el.textContent.trim().slice(0, 30)));
    if (small.length) note(tag, `targets under 44px: ${small.join(' | ')}`);

    await page.click('#tabs a[data-view="sheet"]');
    await page.fill('#owner', lang === 'ar' ? 'صاحب الورقة' : 'The owner');
    await page.locator('#owner').blur();
    await page.fill('#pass', 'short');
    await page.fill('#pass2', 'short');
    await page.click('#pass2 >> xpath=ancestor::form >> button');
    if (!(await page.locator('#save-problem').isVisible())) note(tag, 'a short passphrase was accepted');
    await page.fill('#pass', 'a long passphrase for the test');
    await page.fill('#pass2', 'a long passphrase for the test');
    const [file] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#pass2 >> xpath=ancestor::form >> button')]);
    const saved = join(OUT, `${tag}-backup.json`);
    await file.saveAs(saved);
    const text = await readFile(saved, 'utf8');
    if (/example\.org|Sara|سارة/.test(text)) note(tag, 'the backup is readable without the passphrase');
    await overflow('sheet'); await shot('sheet');

    await page.click('#wipe');
    await page.click('#tabs a[data-view="assets"]');
    if (await page.locator('.row').count()) note(tag, 'erase left assets behind');
    await page.click('#tabs a[data-view="sheet"]');
    await page.setInputFiles('#file', saved);
    await page.fill('#open-pass', 'a long passphrase for the test');
    await page.click('#open-pass >> xpath=ancestor::form >> button');
    await page.click('#tabs a[data-view="assets"]');
    await page.waitForSelector('.row');
    if (await page.locator('.row').count() !== 2) note(tag, 'the backup did not bring the assets back');

    await page.click('#tabs a[data-view="guide"]');
    if ((await page.locator('#toast').textContent()).trim()) note(tag, 'a message from another view is still showing');
    await overflow('guide'); await shot('guide');

    await page.evaluate(() => navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.goto(`${base}?lang=${lang}#assets`);
    await page.reload();
    if (await page.locator('.row').count() !== 2) note(tag, 'the page did not open with no connection');
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px Tajawal')))) note(tag, 'the fonts are missing with no connection');
    await context.setOffline(false);

    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: join(OUT, `${tag}-sheet.pdf`), format: 'A4' });
    await context.close();
  }
}

await browser.close();
server.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('the walk passed in both languages on both screens');
