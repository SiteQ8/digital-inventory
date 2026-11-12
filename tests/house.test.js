// The promises the tool makes, held by tests instead of by care.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { STRINGS } from '../docs/assets/js/engine/i18n.js';
import { SERVICES, CATEGORIES, ACTIONS } from '../docs/assets/js/engine/catalog.js';

const ROOT = new URL('..', import.meta.url).pathname;
const TEXT = new Set(['.js', '.mjs', '.css', '.html', '.md', '.json', '.svg', '.yml', '.txt', '']);

function files(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules' || name === 'shots') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files(path, out);
    else if (TEXT.has(extname(name))) out.push(path);
  }
  return out;
}

const ALL = files(ROOT).map((path) => ({ path: path.slice(ROOT.length), text: readFileSync(path, 'utf8') }));

function flat(value) {
  if (typeof value === 'string') return [value];
  if (typeof value === 'function') return [0, 1, 2, 3, 11, 'x', ''].map((arg) => value(arg));
  if (Array.isArray(value)) return value.flatMap(flat);
  return [];
}

test('both languages carry the same keys and the same shapes', () => {
  const ar = Object.keys(STRINGS.ar).sort();
  assert.deepEqual(ar, Object.keys(STRINGS.en).sort());
  for (const key of ar) {
    assert.equal(typeof STRINGS.ar[key], typeof STRINGS.en[key], key);
    if (Array.isArray(STRINGS.ar[key])) assert.equal(STRINGS.ar[key].length, STRINGS.en[key].length, key);
  }
  for (const item of [...SERVICES.flatMap((s) => [s.name, s.path, s.after, ...s.prepare]), ...CATEGORIES, ...ACTIONS]) {
    assert.ok(item.ar && item.en, JSON.stringify(item));
  }
});

test('Arabic keeps its period for the end of the sentence', () => {
  const arabic = [
    ...Object.values(STRINGS.ar).flatMap(flat),
    ...SERVICES.flatMap((s) => [s.name.ar, s.path.ar, s.after.ar, ...s.prepare.map((p) => p.ar)]),
    ...CATEGORIES.map((c) => c.ar), ...ACTIONS.map((a) => a.ar),
  ];
  assert.ok(arabic.length > 150);
  for (const line of arabic) {
    const inner = line.slice(0, -1);
    assert.ok(!inner.includes('.'), line);
    assert.ok(!/[;؛]/.test(line), line);
  }
});

test('no Unicode dash anywhere in the work', () => {
  const dash = new RegExp(`[${String.fromCharCode(0x2012)}-${String.fromCharCode(0x2015)}${String.fromCharCode(0x2212)}]`);
  for (const { path, text } of ALL) assert.ok(!dash.test(text), path);
});

test('the work carries no word it must never carry', () => {
  const banned = new Set([
    'c857d09db23e6822e3600bc06ad8d58f92ed62bc8efd81c753f77048662cb97d',
    'c70eca6b0f88f44d81a41311647e50fda1ac454ec04ffd442b0eb4743a993131',
    '6afd038687a96730d65753ed0d292878e819324ab3470585c4558861126be9a5',
    '857689a99bb12c6277e299404e2c6c7c95fe4b14c9786b2fed30d7e27123f910',
    'a3b97feed6f830266b738fe1f4879820597cd98b050f514bb6585ff50323a86e',
    '22b3585f09b3951a7a0cf6bb4b534fee3d515e5580d25ae6b1d36c00ff9d6641',
  ]);
  const seen = new Set();
  for (const { path, text } of ALL) {
    for (const word of `${path} ${text}`.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []) {
      if (seen.has(word)) continue;
      seen.add(word);
      assert.ok(!banned.has(createHash('sha256').update(word).digest('hex')), path);
    }
  }
});

test('the page code cannot reach a network', () => {
  const calls = /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|navigator\.serviceWorker|\bimport\s*\(/;
  const code = ALL.filter((f) => f.path.startsWith('docs/assets/js/'));
  assert.ok(code.length >= 6);
  for (const { path, text } of code) assert.ok(!calls.test(text), path);
  const page = ALL.find((f) => f.path === 'docs/index.html').text;
  assert.match(page, /connect-src 'none'/);
  assert.match(page, /default-src 'none'/);
  assert.ok(!/(src|href)="https?:/.test(page), 'the page loads nothing from another host');
  const css = ALL.find((f) => f.path === 'docs/assets/css/app.css').text;
  assert.ok(!/url\(\s*["']?https?:/.test(css));
});

test('colours and durations live in the tokens, not in the rules', () => {
  const css = ALL.find((f) => f.path === 'docs/assets/css/app.css').text;
  const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
  const print = css.slice(css.indexOf('@media print'));
  const rest = css.replace(root, '').replace(print, '');
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(rest), 'a colour outside the tokens');
  assert.ok(!/\b\d+m?s\b/.test(rest), 'a duration outside the tokens');
  assert.ok(!/transition:\s*all/.test(css));
});

test('every Arabic line in the page file has its English in the strings', () => {
  const page = ALL.find((f) => f.path === 'docs/index.html').text;
  for (const [, key] of page.matchAll(/data-t="(\w+)"/g)) {
    assert.equal(typeof STRINGS.ar[key], 'string', key);
    assert.equal(typeof STRINGS.en[key], 'string', key);
  }
});
