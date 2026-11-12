import { CATEGORIES, ACTIONS, SERVICES, CHECKED, service } from './engine/catalog.js';
import * as model from './engine/model.js';
import * as vault from './engine/vault.js';
import { strings, formatDate } from './engine/i18n.js';
import brand from './engine/brand.js';

const STORE = 'digital-inventory';
const STORE_LANG = 'digital-inventory-lang';
const VIEWS = ['assets', 'people', 'sheet', 'guide'];

let state = model.empty();
let lang = 'ar';
let t = strings(lang);
const openAssets = new Set();

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

// A small element builder. Text always goes in as text, never as markup.
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const say = (pair) => pair[lang];

function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = '';
  // Cleared first so the same message is announced when it repeats.
  requestAnimationFrame(() => { el.textContent = text; });
}

function commit(next, focusId) {
  state = next;
  write(STORE, JSON.stringify(state));
  const keep = focusId || (document.activeElement && document.activeElement.id);
  render();
  if (keep) {
    const el = document.getElementById(keep);
    if (el) el.focus({ preventScroll: true });
  }
}

// Typed text is kept without rebuilding the form, so a click that follows the typing
// still lands on the control it was aimed at.
function keep(next) {
  state = next;
  write(STORE, JSON.stringify(state));
  const report = model.readiness(state);
  state.assets.forEach((asset, i) => {
    const row = document.getElementById(`row-${asset.id}`);
    if (row) row.querySelector('summary').replaceWith(rowSummary(asset, report.perAsset[i]));
  });
  renderSeal(report);
  renderPaper(report);
}

function currentView() {
  const name = location.hash.replace('#', '');
  return VIEWS.includes(name) ? name : 'assets';
}

function assetName(asset) {
  const svc = service(asset.service);
  const kind = svc ? say(svc.name) : '';
  return asset.label ? `${asset.label} (${kind})` : kind;
}

function personName(id) {
  const p = state.people.find((x) => x.id === id);
  return p ? p.name : '';
}

/* Fields */

function field(id, label, hint, control) {
  return h('div', { class: 'field' },
    h('label', { for: id }, label),
    control,
    hint ? h('p', { class: 'hint', id: `${id}-hint` }, hint) : null);
}

function textField(asset, key, label, hint, long) {
  const id = `${asset.id}-${key}`;
  const warn = h('p', { class: 'warn', id: `${id}-warn`, hidden: !model.looksSecret(asset[key]) }, t.secretWarn);
  const input = h(long ? 'textarea' : 'input', {
    id, dir: 'auto', autocomplete: 'off', spellcheck: 'false', rows: long ? 2 : null,
    type: long ? null : 'text', 'aria-describedby': hint ? `${id}-hint ${id}-warn` : `${id}-warn`,
    oninput: (e) => { warn.hidden = !model.looksSecret(e.target.value); },
    onchange: (e) => keep(model.updateAsset(state, asset.id, { [key]: e.target.value })),
  });
  input.value = asset[key];
  const box = field(id, label, hint, input);
  box.append(warn);
  return box;
}

function selectField(asset, key, label, options, emptyText) {
  const id = `${asset.id}-${key}`;
  const select = h('select', {
    id,
    onchange: (e) => commit(model.updateAsset(state, asset.id, { [key]: e.target.value })),
  }, h('option', { value: '' }, emptyText), options.map((o) => h('option', { value: o.id }, o.text)));
  select.value = asset[key];
  return field(id, label, null, select);
}

/* Assets view */

function levelLine(svc) {
  const date = formatDate(CHECKED, lang);
  if (svc.level === 'read') return t.levelRead(date);
  if (svc.level === 'link') return t.levelLink(date);
  return t.levelAdvice;
}

function rowSummary(asset, report) {
  const missing = report.missing.length;
  return h('summary', null,
    h('span', { class: 'row-name' }, assetName(asset)),
    h('span', { class: 'row-account', dir: 'auto' }, asset.account),
    h('span', { class: missing ? 'row-state open' : 'row-state done' }, t.missing(missing)));
}

function assetRow(asset, report) {
  const svc = service(asset.service);
  const people = state.people.map((p) => ({ id: p.id, text: p.name }));
  const actions = ACTIONS.map((a) => ({ id: a.id, text: say(a) }));

  const summary = rowSummary(asset, report);

  const steps = svc.prepare.length ? h('div', { class: 'block' },
    h('h4', null, t.stepsHeading),
    h('ul', { class: 'steps' }, svc.prepare.map((step) => {
      const id = `${asset.id}-step-${step.id}`;
      const box = h('input', {
        type: 'checkbox', id,
        onchange: () => commit(model.toggleStep(state, asset.id, step.id)),
      });
      box.checked = asset.done.includes(step.id);
      return h('li', null, box, h('label', { for: id }, say(step)));
    }))) : null;

  const body = h('div', { class: 'row-body' },
    h('div', { class: 'grid' },
      textField(asset, 'label', t.fLabel, t.fLabelHint),
      textField(asset, 'account', t.fAccount, t.fAccountHint),
      selectField(asset, 'recipient', t.fRecipient, people, people.length ? t.choose : t.noPeople),
      selectField(asset, 'action', t.fAction, actions, t.choose)),
    textField(asset, 'where', t.fWhere, t.fWhereHint),
    textField(asset, 'note', t.fNote, null, true),
    svc.money ? h('p', { class: 'money' }, t.moneyNote) : null,
    steps,
    h('div', { class: 'block' },
      h('h4', null, t.pathHeading),
      h('p', null, say(svc.path)),
      h('h4', null, t.afterHeading),
      h('p', null, say(svc.after)),
      h('p', { class: 'level' }, levelLine(svc), ' ',
        svc.source ? h('a', { href: svc.source, rel: 'noopener noreferrer', target: '_blank' }, t.source) : null)),
    h('button', {
      class: 'btn quiet danger', type: 'button', 'aria-label': t.removeAsset(assetName(asset)),
      onclick: () => { openAssets.delete(asset.id); commit(model.removeAsset(state, asset.id), 'add-heading'); },
    }, t.remove));

  const details = h('details', { class: 'row', id: `row-${asset.id}` }, summary, body);
  details.open = openAssets.has(asset.id);
  details.addEventListener('toggle', () => {
    if (details.open) openAssets.add(asset.id); else openAssets.delete(asset.id);
  });
  return h('li', null, details);
}

function adder() {
  const groups = CATEGORIES.map((cat) => {
    const items = SERVICES.filter((s) => s.cat === cat.id);
    return h('div', { class: 'add-group' },
      h('h4', { id: `cat-${cat.id}` }, say(cat)),
      h('div', { class: 'add-items', role: 'group', 'aria-labelledby': `cat-${cat.id}` }, items.map((svc) => h('button', {
        class: 'btn chip', type: 'button',
        onclick: () => {
          const next = model.addAsset(state, svc.id);
          const id = next.assets[next.assets.length - 1].id;
          openAssets.add(id);
          commit(next, `${id}-label`);
          const row = document.getElementById(`row-${id}`);
          if (row) row.scrollIntoView({ block: 'nearest' });
        },
      }, say(svc.name)))));
  });
  return h('section', { class: 'adder', 'aria-labelledby': 'add-heading' },
    h('h3', { id: 'add-heading', tabindex: '-1' }, t.addHeading),
    h('p', { class: 'hint' }, t.addHint),
    groups);
}

function viewAssets(report) {
  const list = state.assets.length
    ? h('ul', { class: 'rows' }, state.assets.map((a, i) => assetRow(a, report.perAsset[i])))
    : h('p', { class: 'empty' }, t.assetsEmpty);
  return [
    h('h2', null, t.assetsHeading),
    h('p', { class: 'rule' }, t.noSecrets),
    list,
    adder(),
  ];
}

/* People view */

function viewPeople() {
  const name = h('input', { id: 'p-name', type: 'text', dir: 'auto', autocomplete: 'off', required: true });
  const relation = h('input', { id: 'p-relation', type: 'text', dir: 'auto', autocomplete: 'off', 'aria-describedby': 'p-relation-hint' });
  const contact = h('input', { id: 'p-contact', type: 'text', dir: 'auto', autocomplete: 'off', inputmode: 'email' });
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
  h('button', { class: 'btn primary', type: 'submit' }, t.addPerson));

  const list = state.people.length
    ? h('ul', { class: 'people' }, state.people.map((p) => {
      const count = state.assets.filter((a) => a.recipient === p.id).length;
      return h('li', null,
        h('div', null,
          h('p', { class: 'person-name' }, p.name, p.relation ? h('span', { class: 'person-rel' }, p.relation) : null),
          h('p', { class: 'hint' }, [p.contact ? h('bdi', null, p.contact) : null, p.contact ? ' · ' : null, t.holds(count)])),
        h('button', {
          class: 'btn quiet danger', type: 'button', 'aria-label': t.removePerson(p.name),
          onclick: () => commit(model.removePerson(state, p.id), 'p-name'),
        }, t.remove));
    }))
    : h('p', { class: 'empty' }, t.peopleEmpty);

  return [h('h2', null, t.peopleHeading), h('p', { class: 'lead' }, t.peopleIntro), list, form];
}

/* Sheet view */

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
    id: 'owner', type: 'text', dir: 'auto', autocomplete: 'off', 'aria-describedby': 'owner-hint',
    onchange: (e) => keep({ ...state, owner: e.target.value.trim().slice(0, 80) }),
  });
  owner.value = state.owner;

  const pass = h('input', { id: 'pass', type: 'password', autocomplete: 'new-password', 'aria-describedby': 'pass-hint save-problem' });
  const pass2 = h('input', { id: 'pass2', type: 'password', autocomplete: 'new-password' });
  const saveProblem = h('p', { class: 'warn', id: 'save-problem', role: 'alert', hidden: true });
  const saveButton = h('button', { class: 'btn primary', type: 'submit' }, t.save);
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
      openAssets.clear();
      commit(model.restore(raw), 'owner');
      toast(t.opened);
    },
  },
  field('file', t.file, null, file),
  field('open-pass', t.pass, null, openPass),
  openProblem,
  h('button', { class: 'btn', type: 'submit' }, t.open));

  return [
    h('h2', null, t.sheetHeading),
    field('owner', t.owner, t.ownerHint, owner),
    h('div', { class: 'tasks' },
      h('section', null,
        h('h3', null, t.printHeading),
        h('p', null, t.printText),
        state.printed ? h('p', { class: 'hint' }, t.printedOn(formatDate(state.printed, lang))) : null,
        h('button', {
          class: 'btn primary', type: 'button', id: 'print',
          onclick: () => { commit({ ...state, printed: today() }, 'print'); window.print(); },
        }, t.print)),
      h('section', null,
        h('h3', null, t.backupHeading),
        h('p', null, t.backupText),
        state.backedUp ? h('p', { class: 'hint' }, t.savedOn(formatDate(state.backedUp, lang))) : null,
        saveForm),
      h('section', null,
        h('h3', null, t.openHeading),
        h('p', null, t.openText),
        openForm),
      h('section', null,
        h('h3', null, t.wipeHeading),
        h('p', null, t.wipeText),
        h('button', {
          class: 'btn danger', type: 'button', id: 'wipe',
          onclick: () => {
            if (!window.confirm(t.confirmWipe)) return;
            erase(STORE);
            openAssets.clear();
            state = model.empty();
            render();
            toast(t.wiped);
          },
        }, t.wipe))),
  ];
}

/* Guide view and the printed sheet */

function guideList() {
  return h('ol', { class: 'guide' }, t.guide.map((line) => h('li', null, line)));
}

function viewGuide() {
  return [h('h2', null, t.guideHeading), h('p', { class: 'lead' }, t.guideIntro), guideList()];
}

function renderPaper(report) {
  const paper = document.getElementById('paper');
  const action = (id) => { const a = ACTIONS.find((x) => x.id === id); return a ? say(a) : t.unassigned; };
  const cell = (text, auto) => h('td', auto ? { dir: 'auto' } : null, text || t.unassigned);

  const table = state.assets.length ? h('table', null,
    h('thead', null, h('tr', null, [t.colAsset, t.colAccount, t.colWhere, t.colAction, t.colRecipient, t.colReady].map((c) => h('th', { scope: 'col' }, c)))),
    h('tbody', null, state.assets.map((a, i) => h('tr', null,
      h('th', { scope: 'row' }, assetName(a)),
      cell(a.account, true), cell(a.where, true), h('td', null, action(a.action)),
      cell(personName(a.recipient), true),
      h('td', null, t.missing(report.perAsset[i].missing.length))))))
    : h('p', null, t.paperEmpty);

  const kinds = [...new Set(state.assets.map((a) => a.service))].map(service);

  paper.replaceChildren(
    h('div', { class: 'sheet' },
      h('h1', null, t.paperTitle(state.owner)),
      h('p', { class: 'sheet-date' }, t.paperDate(formatDate(today(), lang))),
      h('p', { class: 'sheet-notice' }, t.paperNotice),
      table,
      state.assets.some((a) => a.note) ? h('ul', { class: 'sheet-notes' }, state.assets.filter((a) => a.note).map((a) => h('li', null, h('b', null, assetName(a)), ': ', h('bdi', null, a.note)))) : null,
      model.hasMoney(state) ? h('p', { class: 'sheet-notice' }, t.moneyNote) : null,
      h('h2', null, t.paperPeople),
      h('ul', { class: 'sheet-people' }, state.people.map((p) => h('li', null, h('b', null, p.name), p.relation ? ` (${p.relation})` : '', p.contact ? [' ', h('bdi', null, p.contact)] : null))),
      h('div', { class: 'sign' }, h('p', null, t.paperSign), h('p', null, t.paperDateLine))),
    h('div', { class: 'sheet' },
      h('h1', null, t.guideHeading),
      guideList(),
      kinds.length ? h('h2', null, t.paperSteps) : null,
      h('dl', { class: 'sheet-steps' }, kinds.map((svc) => [
        h('dt', null, say(svc.name)),
        h('dd', null, say(svc.after), svc.source ? [' ', h('span', { class: 'sheet-url', dir: 'ltr' }, svc.source)] : null),
      ]))));
}

/* The frame */

function renderSeal(report) {
  const ink = document.getElementById('seal-ink');
  const seal = document.getElementById('seal');
  const figure = document.getElementById('seal-figure');
  const word = document.getElementById('seal-word');
  const started = state.assets.length > 0;
  ink.setAttribute('stroke-dashoffset', String(100 - Math.round(report.share * 100)));
  seal.classList.toggle('sealed', report.sealed);
  figure.textContent = started ? `${report.done} / ${report.total}` : '';
  figure.hidden = !started || report.sealed;
  word.textContent = report.sealed ? t.sealDone : started ? t.sealOpen : t.sealEmpty;
  seal.setAttribute('aria-label', started
    ? `${t.sealLabel}: ${report.sealed ? t.sealDone : `${report.done} / ${report.total} ${t.sealOpen}`}`
    : `${t.sealLabel}: ${t.sealEmpty}`);
}

function render() {
  const report = model.readiness(state);
  const view = currentView();
  document.querySelectorAll('#tabs a').forEach((a) => {
    if (a.dataset.view === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const makers = { assets: () => viewAssets(report), people: viewPeople, sheet: viewSheet, guide: viewGuide };
  document.getElementById('view').replaceChildren(...makers[view]().filter(Boolean));
  renderSeal(report);
  renderPaper(report);
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
  document.getElementById('sources-note').textContent = t.sourcesNote(formatDate(CHECKED, lang));
  const code = document.getElementById('code-link');
  if (brand.repo) { code.href = brand.repo; code.hidden = false; }
  render();
}

function start() {
  const asked = new URLSearchParams(location.search).get('lang');
  const kept = read(STORE_LANG);
  lang = asked === 'en' || asked === 'ar' ? asked : kept === 'en' ? 'en' : 'ar';
  try { state = model.restore(JSON.parse(read(STORE))); } catch { state = model.empty(); }
  document.getElementById('lang').addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    write(STORE_LANG, lang);
    applyLanguage();
  });
  window.addEventListener('hashchange', () => {
    render();
    document.getElementById('main').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  });
  applyLanguage();
}

start();
