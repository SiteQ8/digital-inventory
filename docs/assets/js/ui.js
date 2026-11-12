// The parts both pages draw: the tool draws them live, the front page draws them from a sample
// inventory so every picture on it is the tool itself.

import { CATEGORIES, ACTIONS, SERVICES, CHECKED, service } from './engine/catalog.js';
import * as model from './engine/model.js';
import { formatDate } from './engine/i18n.js';

// A small element builder. Text always goes in as text, never as markup.
export function h(tag, attrs, ...kids) {
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

const NS = 'http://www.w3.org/2000/svg';
const PATHS = {
  check: 'M3.5 8.5l3 3 6-7',
  plus: 'M8 3v10M3 8h10',
  arrow: 'M2.5 8h10M8.5 4l4 4-4 4',
  back: 'M13.5 8h-10M7.5 4l-4 4 4 4',
  pause: 'M5.5 3.5v9M10.5 3.5v9',
  play: 'M5 3.5l7.5 4.5L5 12.5z',
  print: 'M4.5 6V2.5h7V6M4.5 11.5h-2V6h11v5.5h-2M4.5 9.5h7v4h-7z',
};

// One icon family: 16px, one stroke weight. Arrows turn with the reading direction in CSS.
export function icon(name, extra) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', `icon icon--${name}${extra ? ` ${extra}` : ''}`);
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', PATHS[name]);
  svg.append(path);
  return svg;
}

export function context(state, lang, t, on) {
  const say = (pair) => pair[lang];
  const report = model.readiness(state);
  const assetName = (asset) => {
    const svc = service(asset.service);
    return asset.label || (svc ? say(svc.name) : '');
  };
  const kindName = (asset) => {
    const svc = service(asset.service);
    return asset.label && svc ? say(svc.name) : '';
  };
  const personName = (id) => {
    const p = state.people.find((x) => x.id === id);
    return p ? p.name : '';
  };
  return { state, lang, t, say, report, assetName, kindName, personName, on: on || {} };
}

export function stateMark(c, missing) {
  return missing
    ? h('span', { class: 'mark mark--open' }, c.t.missing(missing))
    : h('span', { class: 'mark mark--done' }, icon('check'), c.t.missing(0));
}

/* The list of assets: one line each, what it is, who receives it, what is missing */

export function assetList(c, selected) {
  if (!c.state.assets.length) return null;
  return h('ul', { class: 'rows' }, c.state.assets.map((asset, i) => {
    const who = c.personName(asset.recipient);
    return h('li', null, h('a', {
      class: 'row', href: `#assets/${asset.id}`, 'aria-current': asset.id === selected ? 'true' : null,
    },
    h('span', { class: 'row__name' }, c.assetName(asset),
      c.kindName(asset) ? h('span', { class: 'row__kind' }, c.kindName(asset)) : null),
    h('span', { class: who ? 'row__who entry' : 'row__who' }, who || c.t.unassigned),
    stateMark(c, c.report.perAsset[i].missing.length)));
  }));
}

/* One asset, open */

function field(id, label, hint, control) {
  return h('div', { class: 'field' },
    h('label', { for: id }, label),
    control,
    hint ? h('p', { class: 'hint', id: `${id}-hint` }, hint) : null);
}

function textField(c, asset, key, label, hint, long) {
  const id = `${asset.id}-${key}`;
  const warn = h('p', { class: 'warn', id: `${id}-warn`, hidden: !model.looksSecret(asset[key]) }, c.t.secretWarn);
  const input = h(long ? 'textarea' : 'input', {
    id, class: 'entry', dir: 'auto', autocomplete: 'off', spellcheck: 'false', rows: long ? 2 : null,
    type: long ? null : 'text', 'aria-describedby': hint ? `${id}-hint ${id}-warn` : `${id}-warn`,
    oninput: (e) => { warn.hidden = !model.looksSecret(e.target.value); },
    onchange: (e) => c.on.text && c.on.text(asset.id, key, e.target.value),
  });
  input.value = asset[key];
  const box = field(id, label, hint, input);
  box.append(warn);
  return box;
}

function selectField(c, asset, key, label, options, emptyText) {
  const id = `${asset.id}-${key}`;
  const select = h('select', {
    id, class: asset[key] ? 'entry' : null,
    onchange: (e) => c.on.choice && c.on.choice(asset.id, key, e.target.value),
  }, h('option', { value: '' }, emptyText), options.map((o) => h('option', { value: o.id }, o.text)));
  select.value = asset[key];
  return field(id, label, null, select);
}

export function levelLine(c, svc) {
  const date = formatDate(CHECKED, c.lang);
  if (svc.level === 'read') return c.t.levelRead(date);
  if (svc.level === 'link') return c.t.levelLink(date);
  return c.t.levelAdvice;
}

export function stepList(c, asset) {
  const svc = service(asset.service);
  if (!svc.prepare.length) return null;
  return h('section', { class: 'block' },
    h('h3', null, c.t.stepsHeading),
    h('ul', { class: 'steps' }, svc.prepare.map((step) => {
      const id = `${asset.id}-step-${step.id}`;
      const box = h('input', { type: 'checkbox', id, onchange: () => c.on.step && c.on.step(asset.id, step.id) });
      box.checked = asset.done.includes(step.id);
      return h('li', null, box, h('label', { for: id }, c.say(step)));
    })));
}

export function assetDetail(c, asset) {
  const svc = service(asset.service);
  const i = c.state.assets.indexOf(asset);
  const people = c.state.people.map((p) => ({ id: p.id, text: p.name }));
  const actions = ACTIONS.map((a) => ({ id: a.id, text: c.say(a) }));
  return h('article', { class: 'detail', id: `detail-${asset.id}` },
    h('a', { class: 'back', href: '#assets' }, icon('back'), c.t.backToList),
    h('header', { class: 'detail__head' },
      h('h2', { id: 'detail-title', tabindex: '-1' }, c.assetName(asset)),
      h('span', { id: `state-${asset.id}` }, stateMark(c, c.report.perAsset[i].missing.length))),
    h('div', { class: 'fields' },
      textField(c, asset, 'label', c.t.fLabel, c.t.fLabelHint),
      textField(c, asset, 'account', c.t.fAccount, c.t.fAccountHint),
      selectField(c, asset, 'recipient', c.t.fRecipient, people, people.length ? c.t.choose : c.t.noPeople),
      selectField(c, asset, 'action', c.t.fAction, actions, c.t.choose)),
    textField(c, asset, 'where', c.t.fWhere, c.t.fWhereHint),
    textField(c, asset, 'note', c.t.fNote, null, true),
    svc.money ? h('p', { class: 'note' }, c.t.moneyNote) : null,
    stepList(c, asset),
    h('section', { class: 'block' },
      h('h3', null, c.t.pathHeading),
      h('p', null, c.say(svc.path)),
      h('h3', null, c.t.afterHeading),
      h('p', null, c.say(svc.after)),
      h('p', { class: 'hint' }, levelLine(c, svc), ' ',
        svc.source ? h('a', { class: 'link', href: svc.source, rel: 'noopener noreferrer', target: '_blank' }, c.t.source) : null)),
    h('button', {
      class: 'btn btn--quiet btn--danger', type: 'button',
      'aria-label': c.t.removeAsset(c.assetName(asset)),
      onclick: () => c.on.remove && c.on.remove(asset.id),
    }, c.t.remove));
}

/* The kinds of asset to add, by category */

export function adder(c, only) {
  const cats = only ? CATEGORIES.filter((cat) => only.includes(cat.id)) : CATEGORIES;
  return h('div', { class: 'adder' }, cats.map((cat) => h('div', { class: 'adder__group' },
    h('h3', { id: `cat-${cat.id}` }, c.say(cat)),
    h('div', { class: 'adder__items', role: 'group', 'aria-labelledby': `cat-${cat.id}` },
      SERVICES.filter((s) => s.cat === cat.id).map((svc) => h('button', {
        class: 'chip', type: 'button', onclick: () => c.on.add && c.on.add(svc.id),
      }, icon('plus'), c.say(svc.name)))))));
}

/* The printed sheet. The tool prints it, the front page shows it. */

export function guideList(c) {
  return h('ol', { class: 'guide' }, c.t.guide.map((line) => h('li', null, line)));
}

export function sheetPaper(c, today) {
  const action = (id) => { const a = ACTIONS.find((x) => x.id === id); return a ? c.say(a) : c.t.unassigned; };
  const cell = (text, auto) => h('td', auto ? { dir: 'auto', class: text ? 'entry' : null } : null, text || c.t.unassigned);
  const full = (a) => (c.kindName(a) ? `${c.assetName(a)} (${c.kindName(a)})` : c.assetName(a));
  const table = c.state.assets.length ? h('table', null,
    h('thead', null, h('tr', null, [c.t.colAsset, c.t.colAccount, c.t.colWhere, c.t.colAction, c.t.colRecipient, c.t.colReady].map((x) => h('th', { scope: 'col' }, x)))),
    h('tbody', null, c.state.assets.map((a, i) => h('tr', null,
      h('th', { scope: 'row' }, full(a)),
      cell(a.account, true), cell(a.where, true), h('td', null, action(a.action)),
      cell(c.personName(a.recipient), true),
      h('td', null, c.t.missing(c.report.perAsset[i].missing.length))))))
    : h('p', null, c.t.paperEmpty);
  const noted = c.state.assets.filter((a) => a.note);
  return h('div', { class: 'sheet' },
    h('p', { class: 'sheet__title' }, c.t.paperTitle(c.state.owner)),
    h('p', { class: 'sheet__date' }, c.t.paperDate(formatDate(today, c.lang))),
    h('p', { class: 'sheet__notice' }, c.t.paperNotice),
    table,
    noted.length ? h('ul', { class: 'sheet__notes' }, noted.map((a) => h('li', null, h('b', null, full(a)), ': ', h('bdi', null, a.note)))) : null,
    model.hasMoney(c.state) ? h('p', { class: 'sheet__notice' }, c.t.moneyNote) : null,
    h('p', { class: 'sheet__sub' }, c.t.paperPeople),
    h('ul', { class: 'sheet__people' }, c.state.people.map((p) => h('li', null, h('b', null, p.name), p.relation ? ` (${p.relation})` : '', p.contact ? [' ', h('bdi', null, p.contact)] : null))),
    h('div', { class: 'sheet__sign' }, h('p', null, c.t.paperSign), h('p', null, c.t.paperDateLine)));
}

export function sheetGuide(c) {
  const kinds = [...new Set(c.state.assets.map((a) => a.service))].map(service);
  return h('div', { class: 'sheet' },
    h('p', { class: 'sheet__title' }, c.t.guideHeading),
    guideList(c),
    kinds.length ? h('p', { class: 'sheet__sub' }, c.t.paperSteps) : null,
    h('dl', { class: 'sheet__steps' }, kinds.map((svc) => [
      h('dt', null, c.say(svc.name)),
      h('dd', null, c.say(svc.after), svc.source ? [' ', h('span', { class: 'sheet__url', dir: 'ltr' }, svc.source)] : null),
    ])));
}

/* A sample inventory for the front page. Roles stand where names would, so nobody is invented. */

export function sample(lang) {
  const ar = lang === 'ar';
  let s = model.empty();
  s = model.addPerson(s, { name: ar ? 'الزوجة' : 'Wife' });
  s = model.addPerson(s, { name: ar ? 'الابن الأكبر' : 'Eldest son' });
  const [wife, son] = s.people.map((p) => p.id);
  const safe = ar ? 'في ظرف مغلق داخل خزنة البيت' : 'In a sealed envelope in the home safe';
  const mail = ar ? 'بريدي الشخصي' : 'My personal email';
  const number = ar ? 'رقم هاتفي' : 'My mobile number';
  const rows = [
    ['phone', wife, 'handover', safe, true, number],
    ['apple', wife, 'handover', safe, true, mail],
    ['manager', son, 'handover', safe, true, mail],
    ['google', son, 'decide', safe, false, mail],
    ['bank', wife, 'handover', ar ? 'يراجع الورثة البنك' : 'The heirs go to the bank', true, ''],
    ['whatsapp', wife, 'memorial', '', false, number],
    ['subscription', son, 'close', '', false, mail],
    ['domain', son, 'handover', safe, true, ''],
    ['wallet', '', '', '', false, ''],
    ['computer', '', '', '', false, ''],
    ['telegram', '', 'close', '', false, number],
  ];
  for (const [kind, who, action, where, done, account] of rows) {
    s = model.addAsset(s, kind);
    const id = s.assets[s.assets.length - 1].id;
    s = model.updateAsset(s, id, { recipient: who, action, where, account });
    if (done) for (const step of service(kind).prepare) s = model.toggleStep(s, id, step.id);
  }
  return s;
}
