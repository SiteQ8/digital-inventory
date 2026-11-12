// The front page. Every picture on it is the tool itself, drawn from a sample inventory.

import { CHECKED, ACTIONS, service } from './engine/catalog.js';
import { strings, formatDate } from './engine/i18n.js';
import brand from './engine/brand.js';
import { h, icon, context, assetList, assetDetail, adder, stepList, sheetPaper, levelLine, sample } from './ui.js';

const STORE_LANG = 'digital-inventory-lang';
const CYCLE = 2800;
const LOOP = 3200;

let lang = 'ar';
let t = strings(lang);
let paused = false;
let timers = [];

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => matchMedia('(max-width: 39.99rem)').matches;
const still = () => reduced() || phone();

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, value); } catch { /* the visit still works */ }
}

function piece(x, y, w, title, ...kids) {
  const el = h('div', { class: 'piece' }, title ? h('p', { class: 'piece__title' }, title) : null, kids);
  // Set through the style object: the page's policy refuses style attributes written as text.
  el.style.setProperty('--x', `${x}%`);
  el.style.setProperty('--y', `${y}%`);
  el.style.setProperty('--w', `${w}%`);
  return el;
}

function fake(label, value) {
  return h('div', { class: 'field' }, h('p', { class: 'hint' }, label), h('p', { class: 'fake entry' }, value));
}

function pauseButton(onToggle) {
  const button = h('button', { class: 'pause', type: 'button', 'aria-label': t.pause }, icon('pause'));
  button.addEventListener('click', () => {
    paused = !paused;
    document.querySelectorAll('.pause').forEach((b) => {
      b.replaceChildren(icon(paused ? 'play' : 'pause'));
      b.setAttribute('aria-label', paused ? t.play : t.pause);
    });
    onToggle();
  });
  return button;
}

/* The hero: three sets of pieces from the tool, one set at a time */

function drawCollage(c) {
  const el = document.getElementById('collage');
  const date = formatDate(CHECKED, lang);
  const first = { ...c.state, assets: c.state.assets.slice(0, 5) };
  const listC = context(first, lang, t);
  const apple = c.state.assets.find((a) => a.service === 'apple');
  const partial = { ...apple, done: apple.done.slice(0, 2) };
  const sets = [
    h('div', { class: 'collage__set is-on' },
      piece(6, 7, 66, t.assetsHeading, assetList(listC, '')),
      piece(32, 62, 62, null, fake(t.fWhere, apple.where)),
      piece(6, 84, 40, null, h('p', { class: 'mark mark--open' }, t.readyCount(c.report.done, c.report.total)))),
    h('div', { class: 'collage__set', 'aria-hidden': 'true' },
      piece(6, 7, 66, c.say(service('apple').name), stepList(c, partial).querySelector('.steps')),
      piece(32, 66, 62, t.pathHeading, h('p', { class: 'hint' }, levelLine(c, service('apple'))))),
    h('div', { class: 'collage__set', 'aria-hidden': 'true' },
      piece(6, 7, 66, t.guideHeading, h('ol', { class: 'guide' }, t.guide.slice(0, 2).map((line) => h('li', null, line)))),
      piece(32, 66, 62, t.backupHeading, h('p', { class: 'hint' }, t.savedOn(date)), h('p', { class: 'hint' }, t.printedOn(date)))),
  ];
  el.setAttribute('aria-label', t.heroAlt);
  el.replaceChildren(...sets, still() ? '' : pauseButton(() => {}));
  el.inert = false;
  sets.forEach((s) => { s.inert = true; });
  if (still()) return;
  let on = 0;
  timers.push(setInterval(() => {
    if (paused || document.hidden) return;
    sets[on].classList.remove('is-on');
    on = (on + 1) % sets.length;
    sets[on].classList.add('is-on');
  }, CYCLE));
}

/* The tool window: the list beside one open asset, and one loop inside it */

function drawApp(c) {
  const el = document.getElementById('app-frame');
  const google = c.state.assets.find((a) => a.service === 'google');
  const steps = service('google').prepare.map((s) => s.id);
  const almost = { ...c.state, assets: c.state.assets.map((a) => (a === google ? { ...a, done: steps.slice(0, -1) } : a)) };
  const full = { ...c.state, assets: c.state.assets.map((a) => (a === google ? { ...a, done: steps } : a)) };
  const panes = (state) => {
    const cc = context(state, lang, t);
    const asset = state.assets.find((a) => a.service === 'google');
    return [
      h('div', { class: 'app__pane app__pane--list' },
        h('div', { class: 'md__head' }, h('h2', null, t.assetsHeading), h('span', { class: 'btn btn--primary btn--small' }, icon('plus'), t.addHeading)),
        assetList(cc, asset.id)),
      h('div', { class: 'app__pane app__pane--open' }, assetDetail(cc, asset)),
    ];
  };
  const show = (state) => {
    const kept = el.querySelector('.pause');
    el.replaceChildren(...panes(state), kept || '');
    el.querySelectorAll('.app__pane').forEach((p) => { p.inert = true; });
    // The picture carries no ids of its own, so a label in it never points at the tool's fields.
    el.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    el.querySelectorAll('[for], [aria-describedby]').forEach((n) => { n.removeAttribute('for'); n.removeAttribute('aria-describedby'); });
  };
  el.setAttribute('aria-label', t.toolAlt);
  show(full);
  if (still()) return;
  el.append(pauseButton(() => {}));
  // One change a cycle: the last step is ticked and the asset turns complete, then it starts again.
  let step = 0;
  timers.push(setInterval(() => {
    if (paused || document.hidden) return;
    step = (step + 1) % 4;
    if (step === 1) show(almost);
    if (step === 2) show(full);
  }, LOOP / 4));
}

/* The three steps, each with the part of the tool it uses */

function drawSteps(c) {
  const date = formatDate(CHECKED, lang);
  const apple = c.state.assets.find((a) => a.service === 'apple');
  const cards = [
    [t.step1T, t.step1P, adder(c, ['core', 'devices'])],
    [t.step2T, t.step2P, [fake(t.fRecipient, c.personName(apple.recipient)), fake(t.fAction, c.say(ACTIONS[0])), fake(t.fWhere, apple.where)]],
    [t.step3T, t.step3P, [h('p', { class: 'piece__title' }, t.printHeading), h('p', null, t.printText), h('span', { class: 'btn btn--primary' }, icon('print'), t.print), h('p', { class: 'hint' }, t.printedOn(date))]],
  ];
  document.getElementById('steps-cards').replaceChildren(...cards.map(([title, text, panel], i) => {
    const box = h('div', { class: 'card__panel' }, panel);
    box.inert = true;
    box.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    box.querySelectorAll('[aria-labelledby]').forEach((n) => n.removeAttribute('aria-labelledby'));
    return h('article', { class: 'card span-4' },
      h('p', { class: 'card__num' }, String(i + 1)),
      h('h3', null, title),
      h('p', { class: 'muted' }, text),
      box);
  }));
}

function drawSheet(c) {
  const paper = document.getElementById('paper');
  paper.setAttribute('aria-label', t.sheetAlt);
  paper.replaceChildren(sheetPaper(c, CHECKED));
  paper.firstChild.inert = true;
  document.getElementById('sheet-rows').replaceChildren(...t.sheetRows.map((line) => h('li', null, line)));
}

function drawFaq() {
  document.getElementById('faq').replaceChildren(...t.faq.map(([q, a]) => h('div', { class: 'faq__item' }, h('h3', null, q), h('p', null, a))));
}

/* The hero's entrance: once, on load. The words rise line by line, then the rest settles. */

function enter() {
  const root = document.documentElement;
  const done = () => root.classList.add('m-enter-done');
  const late = root.classList.contains('m-enter-done');
  if (reduced() || late) { done(); return; }
  const h1 = document.getElementById('hero-h');
  const text = h1.textContent;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const words = text.split(' ').map((word) => {
    const inner = h('span', null, word);
    return [h('span', { class: 'mask' }, inner), inner];
  });
  h1.replaceChildren(...words.flatMap(([mask], i) => (i ? [' ', mask] : [mask])));
  const tops = [...new Set(words.map(([mask]) => mask.offsetTop))];
  done();
  const runs = words.map(([mask, inner]) => inner.animate(
    [{ transform: 'translateY(110%)' }, { transform: 'none' }],
    { duration: 700, delay: Math.min(tops.indexOf(mask.offsetTop) * 80, 240), easing: ease, fill: 'backwards' },
  ));
  [document.querySelector('.hero__lead'), document.querySelector('.hero__cta')].forEach((el, i) => el.animate(
    [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
    { duration: 520, delay: 350 + i * 60, easing: ease, fill: 'backwards' },
  ));
  document.getElementById('collage').animate(
    [{ transform: 'scale(0.98)' }, { transform: 'none' }], { duration: 900, easing: ease },
  );
  // The heading gets its own words back once it stands.
  Promise.all(runs.map((r) => r.finished)).then(() => { if (h1.querySelector('.mask')) h1.textContent = text; }).catch(() => {});
}

/* The moment: a line climbs the sheet section and carries its colour up. Follows the scroll. */

function moment() {
  const band = document.getElementById('sheet');
  if (still() || !('IntersectionObserver' in window)) return;
  const blocks = [...band.querySelectorAll('[data-reveal]')];
  band.classList.add('is-live');
  let queued = false;
  const frame = () => {
    queued = false;
    const box = band.getBoundingClientRect();
    const view = window.innerHeight;
    // From the section's top at 90% of the screen to its top at 35%, so it stands whole when framed.
    const p = Math.min(1, Math.max(0, (view * 0.9 - box.top) / (view * 0.55)));
    band.style.setProperty('--p', p.toFixed(4));
    band.style.setProperty('--line-on', p > 0 && p < 1 ? '1' : '0');
    const inset = 24;
    const line = box.bottom - inset - (box.height - 2 * inset) * p;
    for (const block of blocks) {
      // A block shows whole only once the line is above all of it.
      block.classList.toggle('is-shown', p >= 1 || line <= block.getBoundingClientRect().top);
    }
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  frame();
}

/* The bar's menu on a phone, and the action bar that waits until the hero's button is gone */

function chrome() {
  const toggle = document.getElementById('toggle');
  const menu = document.getElementById('menu');
  const close = () => { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { close(); toggle.focus(); } });

  if (!('IntersectionObserver' in window)) return;
  const bar = document.getElementById('actionbar');
  const seen = new Set();
  const watch = new IntersectionObserver((entries) => {
    for (const e of entries) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); }
    // Up only when no screen already shows the same action.
    bar.classList.toggle('is-up', seen.size === 0);
  });
  watch.observe(document.getElementById('hero-cta'));
  watch.observe(document.getElementById('close-cta'));
}

function draw() {
  timers.forEach(clearInterval);
  timers = [];
  paused = false;
  const c = context(sample(lang), lang, t);
  drawCollage(c);
  drawApp(c);
  drawSteps(c);
  drawSheet(c);
  drawFaq();
}

function applyLanguage() {
  t = strings(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = t.title;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t[el.dataset.t]; });
  const button = document.getElementById('lang');
  button.textContent = t.lang;
  button.lang = lang === 'ar' ? 'en' : 'ar';
  button.setAttribute('aria-label', t.langLabel);
  document.querySelectorAll('nav[aria-label]').forEach((n) => n.setAttribute('aria-label', t.navLabel));
  document.getElementById('foot-year').textContent = t.footYear(new Date().getFullYear());
  document.querySelectorAll('[data-repo]').forEach((a) => { if (brand.repo) a.href = brand.repo; else a.hidden = true; });
  document.querySelectorAll('a[href^="app.html"]').forEach((a) => { a.href = `app.html?lang=${lang}`; });
  draw();
}

function start() {
  const asked = new URLSearchParams(location.search).get('lang');
  const kept = read(STORE_LANG);
  lang = asked === 'en' || asked === 'ar' ? asked : kept === 'en' ? 'en' : 'ar';
  document.getElementById('lang').addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    write(STORE_LANG, lang);
    applyLanguage();
  });
  applyLanguage();
  chrome();
  enter();
  moment();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

start();
