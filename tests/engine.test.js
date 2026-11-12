import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../docs/assets/js/engine/model.js';
import * as vault from '../docs/assets/js/engine/vault.js';
import { SERVICES, CATEGORIES, ACTIONS, CHECKED } from '../docs/assets/js/engine/catalog.js';

function sample() {
  let s = model.empty();
  s = model.addPerson(s, { name: 'Sara', relation: 'wife', contact: 'sara@example.org' });
  s = model.addAsset(s, 'apple');
  return s;
}

test('an empty inventory is not started and never sealed', () => {
  const r = model.readiness(model.empty());
  assert.equal(r.share, 0);
  assert.equal(r.sealed, false);
});

test('a new asset misses a recipient, an action, a place and every step', () => {
  const s = sample();
  const apple = SERVICES.find((x) => x.id === 'apple');
  assert.equal(model.gaps(s.assets[0]).length, 3 + apple.prepare.length);
});

test('the inventory seals only when every gap, the backup and the print are done', () => {
  let s = sample();
  const id = s.assets[0].id;
  s = model.updateAsset(s, id, { recipient: s.people[0].id, action: 'handover', where: 'sealed envelope in the safe' });
  for (const step of SERVICES.find((x) => x.id === 'apple').prepare) s = model.toggleStep(s, id, step.id);
  assert.equal(model.gaps(s.assets[0]).length, 0);
  assert.equal(model.readiness(s).sealed, false);
  s = { ...s, backedUp: '2026-11-11' };
  assert.equal(model.readiness(s).open, 1);
  s = { ...s, printed: '2026-11-11' };
  const r = model.readiness(s);
  assert.equal(r.sealed, true);
  assert.equal(r.done, r.total);
});

test('an unknown recipient, action or step is refused', () => {
  let s = sample();
  const id = s.assets[0].id;
  s = model.updateAsset(s, id, { recipient: 'p99', action: 'burn' });
  assert.equal(s.assets[0].recipient, '');
  assert.equal(s.assets[0].action, '');
  s = model.toggleStep(s, id, 'no-such-step');
  assert.deepEqual(s.assets[0].done, []);
});

test('removing a person frees the assets they held', () => {
  let s = sample();
  s = model.updateAsset(s, s.assets[0].id, { recipient: s.people[0].id });
  s = model.removePerson(s, s.people[0].id);
  assert.equal(s.assets[0].recipient, '');
});

test('the inventory has no field that could hold a secret', () => {
  const secret = /pass|secret|pin|code|key|seed|card|iban|otp/i;
  for (const f of [...model.ASSET_FIELDS, ...model.PERSON_FIELDS]) assert.ok(!secret.test(f), f);
  const s = sample();
  assert.deepEqual(Object.keys(s.assets[0]).sort(), [...model.ASSET_FIELDS].sort());
  assert.deepEqual(Object.keys(s.people[0]).sort(), [...model.PERSON_FIELDS].sort());
});

test('text that carries a secret is noticed, ordinary notes are not', () => {
  for (const text of [
    'password: Tr0ub4dor',
    'كلمة المرور: abc12345',
    'الرقم السري = 4821',
    'legal winner thank year wave sausage worth useful legal winner thank yellow',
    '4111 1111 1111 1111',
  ]) assert.equal(model.looksSecret(text), true, text);
  for (const text of [
    'in a sealed envelope in the home safe',
    'في ظرف مغلق داخل خزنة البيت',
    'the password is in the manager',
    'sara@example.org',
    '',
  ]) assert.equal(model.looksSecret(text), false, text);
});

test('restore keeps what the model knows and drops the rest', () => {
  let s = sample();
  s = model.updateAsset(s, s.assets[0].id, { recipient: s.people[0].id, action: 'handover', where: 'safe' });
  s = model.toggleStep(s, s.assets[0].id, 'key');
  const raw = JSON.parse(JSON.stringify(s));
  raw.assets[0].password = 'never';
  raw.assets.push({ service: 'no-such-service' });
  raw.evil = true;
  const back = model.restore(raw);
  assert.equal(back.assets.length, 1);
  assert.equal('password' in back.assets[0], false);
  assert.equal('evil' in back, false);
  assert.equal(back.assets[0].recipient, back.people[0].id);
  assert.deepEqual(back.assets[0].done, ['key']);
  assert.deepEqual(model.restore(null), model.empty());
  assert.deepEqual(model.restore({ v: 99 }), model.empty());
});

test('a backup opens with its passphrase and only with it', async () => {
  const s = sample();
  const envelope = await vault.seal(s, 'a long passphrase here', 100000);
  assert.equal(JSON.stringify(envelope).includes('Sara'), false);
  assert.deepEqual(await vault.open(envelope, 'a long passphrase here'), s);
  await assert.rejects(vault.open(envelope, 'a wrong passphrase here'), /passphrase/);
  await assert.rejects(vault.open({ ...envelope, data: envelope.data.slice(4) + 'AAAA' }, 'a long passphrase here'), /passphrase/);
  await assert.rejects(vault.open({ format: 'other' }, 'x'), /format/);
  await assert.rejects(vault.open({ ...envelope, iterations: 10 }, 'a long passphrase here'), /format/);
});

test('a short passphrase is refused and the default work factor is high', async () => {
  await assert.rejects(vault.seal(sample(), 'short'), /short/);
  assert.ok(vault.ITERATIONS >= 600000);
  assert.ok(vault.MIN_PASSPHRASE >= 12);
});

test('the catalogue is whole: categories, steps, sources and levels', () => {
  const cats = new Set(CATEGORIES.map((c) => c.id));
  const ids = new Set();
  assert.match(CHECKED, /^\d{4}-\d{2}-\d{2}$/);
  for (const svc of SERVICES) {
    assert.ok(!ids.has(svc.id), svc.id);
    ids.add(svc.id);
    assert.ok(cats.has(svc.cat), svc.id);
    assert.equal(new Set(svc.prepare.map((p) => p.id)).size, svc.prepare.length, svc.id);
    if (svc.level === 'advice') assert.equal(svc.source, undefined, svc.id);
    else {
      assert.ok(['read', 'link'].includes(svc.level), svc.id);
      assert.match(svc.source, /^https:\/\//, svc.id);
    }
  }
  for (const cat of cats) assert.ok(SERVICES.some((s) => s.cat === cat), cat);
  assert.equal(new Set(ACTIONS.map((a) => a.id)).size, ACTIONS.length);
});
