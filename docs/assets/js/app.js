import * as model from './engine/model.js';
import * as vault from './engine/vault.js';
import { CHECKED } from './engine/catalog.js';
import { strings, formatDate } from './engine/i18n.js';
import brand from './engine/brand.js';
import { h, icon, context, assetList, assetDetail, adder, guideList, sheetPaper, sheetGuide, stateMark } from './ui.js';

const STORE = 'digital-inventory';
const STORE_LANG = 'digital-inventory-lang';
const VIEWS = ['assets', 'people', 'sheet', 'guide'];

let state = model.empty();
let lang = 'ar';
let t = strings(lang);

// Storage can be missing or blocked. The page then works for the visit and keeps nothing.
function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, value); } catch { /* the visit still works */ }
}
function erase(key) {
  try { localStorage.removeItem(key); } catch { /* nothing was kept */ }
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = '';
  // Cleared first so the same message is announced when it repeats.
  requestAnimationFrame(() => { el.textContent = text; });
}

function route() {
  const [view, sub] = location.hash.replace('#', '').split('/');
  return { view: VIEWS.includes(view) ? view : 'assets', sub: sub || '' };
}

let pendingFocus = '';

// Moves to a view and says where the keyboard should land once it is drawn.
function go(hash, focusId) {
  pendingFocus = focusId || '';
  if (location.hash === hash) { render(); landFocus(); } else location.hash = hash;
}

function landFocus() {
  const id = pendingFocus || (route().sub ? 'detail-title' : 'assets-title');
  pendingFocus = '';
  const el = document.getElementById(id) || document.getElementById('page-title');
  if (el) el.focus({ preventScroll: true });
}

const handlers = {
  text: (id, key, value) => keep(model.updateAsset(state, id, { [key]: value })),
  choice: (id, key, value) => commit(model.updateAsset(state, id, { [key]: value })),
  step: (id, step) => commit(model.toggleStep(state, id, step)),
  remove: (id) => { state = model.removeAsset(state, id); save(); go('#assets', 'assets-title'); },
  add: (kind) => {
    state = model.addAsset(state, kind);
    save();
    const id = state.assets[state.assets.length - 1].id;
    go(`#assets/${id}`, `${id}-label`);
  },
};

function ctx() {
  return context(state, lang, t, handlers);
}

function save() {
  write(STORE, JSON.stringify(state));
}

// A full redraw, for a change that alters what the page offers.
function commit(next, focusId) {
  state = next;
  save();
  const keepId = focusId || (document.activeElement && document.activeElement.id);
  render();
  if (keepId) {
    const el = document.getElementById(keepId);
    if (el) el.focus({ preventScroll: true });
  }
}

// Typed text is kept without rebuilding the form, so a click that follows the typing
// still lands on the control it was aimed at.
function keep(next) {
  state = next;
  save();
  const c = ctx();
  const { sub } = route();
  const list = document.getElementById('asset-list');
  if (list) list.replaceChildren(assetList(c, shownId(sub)) || '');
  const asset = state.assets.find((a) => a.id === shownId(sub));
  if (asset) {
    const i = state.assets.indexOf(asset);
    const mark = document.getElementById(`state-${asset.id}`);
    if (mark) mark.replaceChildren(stateMark(c, c.report.perAsset[i].missing.length));
    const title = document.getElementById('detail-title');
    if (title) title.textContent = c.assetName(asset);
  }
  renderReady(c);
  renderPaper(c);
}

function selectedId(sub) {
  if (sub === 'add') return '';
  if (state.assets.some((a) => a.id === sub)) return sub;
  return '';
}

// A wide screen always shows an asset beside the list, the first one when none is chosen.
function shownId(sub) {
  if (sub === 'add') return '';
  return selectedId(sub) || (state.assets[0] ? state.assets[0].id : '');
}

/* Assets: the list beside the open asset */

function viewAssets(c, sub) {
  // A phone shows the list or the open asset, never both.
  const shown = state.assets.find((a) => a.id === shownId(sub));
  const open = sub ? 'detail' : 'list';
  const addPane = h('article', { class: 'detail' },
    h('a', { class: 'back', href: '#assets' }, icon('back'), t.backToList),
    h('header', { class: 'detail__head' }, h('h2', { id: 'detail-title', tabindex: '-1' }, t.addHeading)),
    h('p', { class: 'lead' }, state.assets.length ? t.addHint : t.assetsEmpty),
    adder(c));
  return [h('div', { class: 'md', 'data-open': open },
    h('section', { class: 'md__list', 'aria-labelledby': 'assets-title' },
      h('header', { class: 'md__head' },
        h('h1', { id: 'assets-title', tabindex: '-1' }, t.assetsHeading),
        h('a', { class: 'btn btn--primary btn--small', href: '#assets/add', id: 'add-link' }, icon('plus'), t.addHeading)),
      h('p', { class: 'note' }, t.noSecrets),
      h('div', { id: 'asset-list' }, assetList(c, shown ? shown.id : ''))),
    h('section', { class: 'md__detail', 'aria-labelledby': 'detail-title' },
      shown ? assetDetail(c, shown) : addPane))];
}

/* Recipients */

function field(id, label, hint, control) {
  return h('div', { class: 'field' },
    h('label', { for: id }, label),
    control,
    hint ? h('p', { class: 'hint', id: `${id}-hint` }, hint) : null);
}

function viewPeople() {
  const name = h('input', { id: 'p-name', class: 'entry', type: 'text', dir: 'auto', autocomplete: 'off', required: true });
  const relation = h('input', { id: 'p-relation', class: 'entry', type: 'text', dir: 'auto', autocomplete: 'off', 'aria-describedby': 'p-relation-hint' });
  const contact = h('input', { id: 'p-contact', class: 'entry', type: 'text', dir: 'auto', autocomplete: 'off', inputmode: 'email' });
  const form = h('form', {
    class: 'person-form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      if (!name.value.trim()) { name.focus(); return; }
      commit(model.addPerson(state, { name: name.value, relation: relation.value, contact: contact.value }), 'p-name');
    },
  },
  field('p-name', t.pName, null, name),
  field('p-relation', t.pRelation, t.pRelationHint, relation),
  field('p-contact', t.pContact, null, contact),
  h('button', { class: 'btn btn--primary', type: 'submit' }, t.addPerson));

  const list = state.people.length
    ? h('ul', { class: 'people' }, state.people.map((p) => {
      const count = state.assets.filter((a) => a.recipient === p.id).length;
      return h('li', null,
        h('div', null,
          h('p', { class: 'people__name entry' }, p.name, p.relation ? h('span', { class: 'people__rel' }, p.relation) : null),
          h('p', { class: 'hint' }, [p.contact ? h('bdi', null, p.contact) : null, p.contact ? ' · ' : null, t.holds(count)])),
        h('button', {
          class: 'btn btn--quiet btn--danger', type: 'button', 'aria-label': t.removePerson(p.name),
          onclick: () => commit(model.removePerson(state, p.id), 'p-name'),
        }, t.remove));
    }))
    : h('p', { class: 'empty' }, t.peopleEmpty);

  return [h('div', { class: 'page' },
    h('h1', { id: 'page-title', tabindex: '-1' }, t.peopleHeading),
    h('p', { class: 'lead' }, t.peopleIntro), list, form)];
}

/* The sheet: print, back up, open a copy, erase */

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function problem(el, text) {
  el.textContent = text;
  el.hidden = !text;
}

function viewSheet() {
  const owner = h('input', {
    id: 'owner', class: 'entry', type: 'text', dir: 'auto', autocomplete: 'off', 'aria-describedby': 'owner-hint',
    onchange: (e) => keep({ ...state, owner: e.target.value.trim().slice(0, 80) }),
  });
  owner.value = state.owner;

  const pass = h('input', { id: 'pass', type: 'password', autocomplete: 'new-password', 'aria-describedby': 'pass-hint save-problem' });
  const pass2 = h('input', { id: 'pass2', type: 'password', autocomplete: 'new-password' });
  const saveProblem = h('p', { class: 'warn', id: 'save-problem', role: 'alert', hidden: true });
  const saveButton = h('button', { class: 'btn', type: 'submit' }, t.save);
  const saveForm = h('form', {
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      if (pass.value.length < vault.MIN_PASSPHRASE) { problem(saveProblem, t.errShort(vault.MIN_PASSPHRASE)); pass.focus(); return; }
      if (pass.value !== pass2.value) { problem(saveProblem, t.errMatch); pass2.focus(); return; }
      problem(saveProblem, '');
      saveButton.disabled = true;
      try {
        const stamped = { ...state, backedUp: today() };
        const envelope = await vault.seal(stamped, pass.value);
        download(`digital-inventory-${today()}.json`, JSON.stringify(envelope));
        commit(stamped, 'pass');
        toast(t.saved);
      } finally {
        saveButton.disabled = false;
      }
    },
  },
  field('pass', t.pass, t.passHint(vault.MIN_PASSPHRASE), pass),
  field('pass2', t.pass2, null, pass2),
  saveProblem, saveButton);

  const file = h('input', { id: 'file', type: 'file', accept: 'application/json,.json' });
  const openPass = h('input', { id: 'open-pass', type: 'password', autocomplete: 'off', 'aria-describedby': 'open-problem' });
  const openProblem = h('p', { class: 'warn', id: 'open-problem', role: 'alert', hidden: true });
  const openForm = h('form', {
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      if (!file.files.length) { problem(openProblem, t.errFile); file.focus(); return; }
      let envelope;
      try { envelope = JSON.parse(await file.files[0].text()); } catch { problem(openProblem, t.errFormat); return; }
      let raw;
      try { raw = await vault.open(envelope, openPass.value); } catch (err) {
        problem(openProblem, err.message === 'format' ? t.errFormat : t.errPass);
        return;
      }
      problem(openProblem, '');
      if (!window.confirm(t.confirmOpen)) return;
      commit(model.restore(raw), 'owner');
      toast(t.opened);
    },
  },
  field('file', t.file, null, file),
  field('open-pass', t.pass, null, openPass),
  openProblem,
  h('button', { class: 'btn', type: 'submit' }, t.open));

  return [h('div', { class: 'page' },
    h('h1', { id: 'page-title', tabindex: '-1' }, t.sheetHeading),
    field('owner', t.owner, t.ownerHint, owner),
    h('div', { class: 'tasks' },
      h('section', null,
        h('h2', null, t.printHeading),
        h('p', null, t.printText),
        state.printed ? h('p', { class: 'hint' }, t.printedOn(formatDate(state.printed, lang))) : null,
        h('button', {
          class: 'btn btn--primary', type: 'button', id: 'print',
          onclick: () => { commit({ ...state, printed: today() }, 'print'); window.print(); },
        }, icon('print'), t.print)),
      h('section', null,
        h('h2', null, t.backupHeading),
        h('p', null, t.backupText),
        state.backedUp ? h('p', { class: 'hint' }, t.savedOn(formatDate(state.backedUp, lang))) : null,
        saveForm),
      h('section', null,
        h('h2', null, t.openHeading),
        h('p', null, t.openText),
        openForm),
      h('section', null,
        h('h2', null, t.wipeHeading),
        h('p', null, t.wipeText),
        h('button', {
          class: 'btn btn--danger', type: 'button', id: 'wipe',
          onclick: () => {
            if (!window.confirm(t.confirmWipe)) return;
            erase(STORE);
            state = model.empty();
            render();
            toast(t.wiped);
          },
        }, t.wipe))))];
}

function viewGuide(c) {
  return [h('div', { class: 'page' },
    h('h1', { id: 'page-title', tabindex: '-1' }, t.guideHeading),
    h('p', { class: 'lead' }, t.guideIntro), guideList(c))];
}

/* The frame */

function renderPaper(c) {
  document.getElementById('paper').replaceChildren(sheetPaper(c, today()), sheetGuide(c));
}

function renderReady(c) {
  const el = document.getElementById('ready');
  const r = c.report;
  const started = state.assets.length > 0;
  el.classList.toggle('is-done', r.sealed);
  el.replaceChildren(r.sealed ? icon('check') : '', r.sealed ? t.readyDone : started ? t.readyCount(r.done, r.total) : t.readyEmpty);
}

function render() {
  const c = ctx();
  const { view, sub } = route();
  document.querySelectorAll('#tabs a').forEach((a) => {
    if (a.dataset.view === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const makers = { assets: () => viewAssets(c, sub), people: viewPeople, sheet: viewSheet, guide: () => viewGuide(c) };
  document.getElementById('view').replaceChildren(...makers[view]());
  renderReady(c);
  renderPaper(c);
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
  document.getElementById('tabs').setAttribute('aria-label', t.tabsLabel);
  document.getElementById('home').setAttribute('aria-label', t.homeLabel);
  document.getElementById('sources-note').textContent = t.sourcesNote(formatDate(CHECKED, lang));
  const code = document.getElementById('code-link');
  if (brand.repo) { code.href = brand.repo; code.hidden = false; }
  render();
}

function start() {
  const asked = new URLSearchParams(location.search).get('lang');
  const kept = read(STORE_LANG);
  lang = asked === 'en' || asked === 'ar' ? asked : kept === 'en' ? 'en' : 'ar';
  if (asked === 'en' || asked === 'ar') write(STORE_LANG, asked);
  try { state = model.restore(JSON.parse(read(STORE))); } catch { state = model.empty(); }
  document.getElementById('lang').addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    write(STORE_LANG, lang);
    applyLanguage();
  });
  window.addEventListener('hashchange', () => {
    document.getElementById('toast').textContent = '';
    render();
    landFocus();
    window.scrollTo(0, 0);
  });
  applyLanguage();
  // The worker keeps the page on the device. Without it the page still works while online.
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

start();
