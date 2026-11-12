// Writes the list of files and their fingerprint into docs/sw.js, so a phone that opened the
// page once can open it again with no connection. Run it after changing anything under docs/.
//   node scripts/stamp.mjs

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = fileURLToPath(new URL('../docs/', import.meta.url));
const SW = join(DOCS, 'sw.js');

function walk(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

// Every published file except the worker itself and the domain file.
export function manifest() {
  const paths = walk(DOCS).filter((p) => p !== SW && !p.endsWith('CNAME'));
  const hash = createHash('sha256');
  const files = paths.map((p) => {
    const rel = p.slice(DOCS.length).split('\\').join('/');
    hash.update(rel).update(readFileSync(p));
    return rel;
  });
  return { files: ['./', ...files], version: hash.digest('hex').slice(0, 12) };
}

export function stamped(source, { files, version }) {
  return source
    .replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`)
    .replace(/const FILES = \[[^\]]*\];/, `const FILES = ${JSON.stringify(files, null, 2).replace(/"/g, "'")};`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = stamped(readFileSync(SW, 'utf8'), manifest());
  writeFileSync(SW, next);
  console.log('stamped', manifest().version);
}
