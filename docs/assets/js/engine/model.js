// The inventory itself: people, assets, and what is still missing.
// Pure functions only, so the page and the tests run the same code.

import { SERVICES, ACTIONS, service } from './catalog.js';

export const VERSION = 1;

// The inventory never has a field for a secret. The test suite reads this list.
export const ASSET_FIELDS = ['id', 'service', 'label', 'account', 'where', 'action', 'recipient', 'note', 'done'];
export const PERSON_FIELDS = ['id', 'name', 'relation', 'contact'];

export function empty() {
  return { v: VERSION, owner: '', people: [], assets: [], backedUp: null, printed: null, seq: 0 };
}

function clean(text, max) {
  return String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, max);
}

function nextId(state, prefix) {
  const seq = state.seq + 1;
  return [seq, prefix + seq];
}

export function addPerson(state, input) {
  const name = clean(input.name, 80);
  if (!name) return state;
  const [seq, id] = nextId(state, 'p');
  const person = { id, name, relation: clean(input.relation, 40), contact: clean(input.contact, 80) };
  return { ...state, seq, people: [...state.people, person] };
}

export function removePerson(state, id) {
  return {
    ...state,
    people: state.people.filter((p) => p.id !== id),
    assets: state.assets.map((a) => (a.recipient === id ? { ...a, recipient: '' } : a)),
  };
}

export function addAsset(state, serviceId) {
  const svc = service(serviceId);
  if (!svc) return state;
  const [seq, id] = nextId(state, 'a');
  const asset = { id, service: svc.id, label: '', account: '', where: '', action: '', recipient: '', note: '', done: [] };
  return { ...state, seq, assets: [...state.assets, asset] };
}

export function updateAsset(state, id, patch) {
  const limits = { label: 60, account: 80, where: 160, note: 300 };
  return {
    ...state,
    assets: state.assets.map((a) => {
      if (a.id !== id) return a;
      const next = { ...a };
      for (const key of Object.keys(limits)) {
        if (key in patch) next[key] = clean(patch[key], limits[key]);
      }
      if ('action' in patch) next.action = ACTIONS.some((x) => x.id === patch.action) ? patch.action : '';
      if ('recipient' in patch) next.recipient = state.people.some((p) => p.id === patch.recipient) ? patch.recipient : '';
      return next;
    }),
  };
}

export function toggleStep(state, id, stepId) {
  return {
    ...state,
    assets: state.assets.map((a) => {
      if (a.id !== id) return a;
      const svc = service(a.service);
      if (!svc || !svc.prepare.some((s) => s.id === stepId)) return a;
      const done = a.done.includes(stepId) ? a.done.filter((s) => s !== stepId) : [...a.done, stepId];
      return { ...a, done };
    }),
  };
}

export function removeAsset(state, id) {
  return { ...state, assets: state.assets.filter((a) => a.id !== id) };
}

// What one asset still needs. Each entry is a key the page translates.
export function gaps(asset) {
  const svc = service(asset.service);
  const out = [];
  if (!asset.recipient) out.push({ kind: 'recipient' });
  if (!asset.action) out.push({ kind: 'action' });
  if (!asset.where) out.push({ kind: 'where' });
  if (svc) {
    for (const step of svc.prepare) {
      if (!asset.done.includes(step.id)) out.push({ kind: 'step', step: step.id });
    }
  }
  return out;
}

export function readiness(state) {
  let total = 0;
  let open = 0;
  const perAsset = state.assets.map((asset) => {
    const svc = service(asset.service);
    const all = 3 + (svc ? svc.prepare.length : 0);
    const missing = gaps(asset);
    total += all;
    open += missing.length;
    return { id: asset.id, all, missing };
  });
  // Two things belong to the whole inventory: a backup and a printed sheet.
  total += 2;
  if (!state.backedUp) open += 1;
  if (!state.printed) open += 1;
  const done = total - open;
  const empty = state.assets.length === 0;
  return {
    total, done, open, perAsset,
    share: empty ? 0 : done / total,
    sealed: !empty && open === 0,
  };
}

// A note that seems to carry a secret. The page warns and never blocks,
// because only the owner knows what the text really is.
const SECRET_WORDS = /(password|passcode|pin|otp|seed|كلمة\s*(ال)?مرور|كلمة\s*(ال)?سر|الرقم\s*السري|رمز\s*(ال)?فتح)\s*[:=]\s*\S+/i;

export function looksSecret(text) {
  const value = String(text || '');
  if (SECRET_WORDS.test(value)) return true;
  // A recovery phrase: twelve or more short lowercase words in a row.
  if (/(?:\b[a-z]{3,8}\b[ ,]+){11,}\b[a-z]{3,8}\b/.test(value)) return true;
  // A card number: thirteen to nineteen digits, spaced or not.
  if (/(?:\d[ -]?){13,19}/.test(value)) return true;
  return false;
}

export function hasMoney(state) {
  return state.assets.some((a) => {
    const svc = service(a.service);
    return svc && svc.money;
  });
}

// Reads a saved or imported inventory and keeps only what the model knows.
export function restore(raw) {
  const base = empty();
  if (!raw || typeof raw !== 'object' || raw.v !== VERSION) return base;
  let state = { ...base, owner: clean(raw.owner, 80) };
  const ids = new Map();
  for (const p of Array.isArray(raw.people) ? raw.people.slice(0, 50) : []) {
    const before = state.people.length;
    state = addPerson(state, p || {});
    if (state.people.length > before && p && p.id) ids.set(p.id, state.people[before].id);
  }
  for (const a of Array.isArray(raw.assets) ? raw.assets.slice(0, 300) : []) {
    if (!a || !service(a.service)) continue;
    state = addAsset(state, a.service);
    const id = state.assets[state.assets.length - 1].id;
    state = updateAsset(state, id, { ...a, recipient: ids.get(a.recipient) || '' });
    for (const step of Array.isArray(a.done) ? a.done : []) state = toggleStep(state, id, String(step));
  }
  const stamp = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  return { ...state, backedUp: stamp(raw.backedUp), printed: stamp(raw.printed) };
}

export function serviceCount() {
  return SERVICES.length;
}
