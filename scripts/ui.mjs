// A walk through both pages in a real browser, in both languages, on a desktop and a phone.
// Development only: it needs Playwright, which the site itself never uses.
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
    const small = async (view) => {
      const list = await page.evaluate(() => [...document.querySelectorAll('button, a.btn, .tabs a, .nav__links a, .row, .chip, select, input:not([type=checkbox]), .foot__links a, .logo')]
        .filter((el) => el.offsetParent && !el.closest('[inert]') && el.getBoundingClientRect().height < 43.5).map((el) => el.id || el.textContent.trim().slice(0, 30)));
      if (list.length) note(tag, `${view} targets under 44px: ${list.join(' | ')}`);
    };

    /* The front page */
    await page.goto(`${base}?lang=${lang}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    if (await page.getAttribute('html', 'dir') !== (lang === 'ar' ? 'rtl' : 'ltr')) note(tag, 'wrong direction');
    if (await page.locator('#hero-h .mask').count()) note(tag, 'the heading kept its entrance masks');
    if (await page.locator('#app-frame .row').count() < 9) note(tag, 'the tool window shows too few assets');
    if (await page.locator('#faq .faq__item').count() !== 6) note(tag, 'the questions are missing');
    if (!(await page.locator('#paper table').count())) note(tag, 'the sheet is missing from its section');
    const tall = await page.evaluate(() => [document.querySelector('.hero').getBoundingClientRect().height, innerHeight]);
    if (Math.abs(tall[0] - tall[1]) > 1) note(tag, `the hero is ${tall[0]}px on a ${tall[1]}px screen`);
    await overflow('front'); await small('front'); await shot('front');
    if (name === 'desktop') {
      const screens = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
      if (Math.abs(screens - Math.round(screens)) > 0.01) note(tag, `the front page is ${screens.toFixed(2)} screens, not whole screens`);
      await page.evaluate(() => window.scrollTo(0, document.getElementById('sheet').offsetTop - innerHeight * 0.6));
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(OUT, `${tag}-moment.png`) });
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.click('#hero-cta');
    await page.waitForURL(/app\.html/);

    /* The tool */
    await page.waitForSelector('#add-link');
    await overflow('empty'); await shot('empty');
    await page.click('#tabs a[data-view="people"]');
    await page.fill('#p-name', lang === 'ar' ? 'الزوجة' : 'Wife');
    await page.fill('#p-contact', 'family@example.org');
    await page.click('.person-form button');
    if (await page.locator('.people li').count() !== 1) note(tag, 'the recipient was not added');
    await overflow('people'); await small('people'); await shot('people');

    await page.click('#tabs a[data-view="assets"]');
    await page.click('#add-link');
    await page.click('.adder .chip >> nth=0');
    await page.waitForSelector('.detail .fields');
    await page.click('.md__list #add-link', { force: true }).catch(() => page.evaluate(() => { location.hash = '#assets/add'; }));
    await page.evaluate(() => { location.hash = '#assets/add'; });
    await page.waitForSelector('.adder');
    await page.click('.adder .chip >> nth=11');
    await page.evaluate(() => { location.hash = '#assets'; });
    await page.waitForFunction(() => location.hash === '#assets');
    if (await page.locator('.row').count() !== 2) note(tag, 'two assets were added but the list does not show two');
    await page.locator('.row').first().evaluate((el) => el.click());
    const id = await page.evaluate(() => location.hash.split('/')[1]);
    await page.waitForSelector(`#${id}-label`);
    await page.fill(`#${id}-label`, lang === 'ar' ? 'الحساب الشخصي' : 'Personal account');
    await page.fill(`#${id}-account`, 'owner@example.org');
    await page.fill(`#${id}-where`, 'password: hunter2secret');
    if (!(await page.locator(`#${id}-where-warn`).isVisible())) note(tag, 'a typed secret raised no warning');
    await page.fill(`#${id}-where`, lang === 'ar' ? 'في ظرف مغلق داخل خزنة البيت' : 'In a sealed envelope in the home safe');
    await page.locator(`#${id}-where`).blur();
    await page.selectOption(`#${id}-recipient`, { index: 1 });
    await page.selectOption(`#${id}-action`, 'handover');
    for (const box of await page.locator('.detail .steps input').all()) await box.check();
    if (!(await page.locator('.detail__head .mark--done').count())) note(tag, 'a finished asset is not shown as complete');
    if (await page.inputValue(`#${id}-account`) !== 'owner@example.org') note(tag, 'typed text was lost by the click after it');
    if (!(await page.locator('.row[aria-current] .row__name').textContent()).includes(lang === 'ar' ? 'الحساب الشخصي' : 'Personal account')) note(tag, 'the list does not show the new name');
    await overflow('asset'); await small('asset'); await shot('asset');

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
    if (/example\.org|Wife|الزوجة/.test(text)) note(tag, 'the backup is readable without the passphrase');
    await overflow('sheet'); await small('sheet'); await shot('sheet');

    await page.click('#wipe');
    await page.click('#tabs a[data-view="assets"]');
    if (await page.locator('.row').count()) note(tag, 'erase left assets behind');
    await page.click('#tabs a[data-view="sheet"]');
    await page.setInputFiles('#file', saved);
    await page.fill('#open-pass', 'a long passphrase for the test');
    await page.click('#open-pass >> xpath=ancestor::form >> button');
    await page.click('#tabs a[data-view="assets"]');
    await page.waitForSelector('.row', { state: 'attached' });
    if (await page.locator('.row').count() !== 2) note(tag, 'the backup did not bring the assets back');

    await page.click('#tabs a[data-view="guide"]');
    await page.waitForSelector('#view .guide');
    if ((await page.locator('#toast').textContent()).trim()) note(tag, 'a message from another view is still showing');
    await overflow('guide'); await shot('guide');

    await page.evaluate(() => navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.goto(`${base}app.html?lang=${lang}#assets`);
    await page.reload();
    if (await page.locator('.row').count() !== 2) note(tag, 'the tool did not open with no connection');
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px "IBM Plex Sans Arabic"') && document.fonts.check('16px SUSE')))) note(tag, 'the fonts are missing with no connection');
    await page.goto(`${base}?lang=${lang}`);
    if (!(await page.locator('#hero-h').textContent()).trim()) note(tag, 'the front page did not open with no connection');
    await context.setOffline(false);

    await page.goto(`${base}app.html?lang=${lang}#sheet`);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: join(OUT, `${tag}-sheet.pdf`), format: 'A4' });
    await context.close();
  }
}

await browser.close();
server.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('the walk passed in both languages on both screens');
