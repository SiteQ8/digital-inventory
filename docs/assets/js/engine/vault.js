// The backup file: the inventory sealed with a passphrase, on the device.
// AES-256-GCM with a key from PBKDF2-SHA-256. Nothing here talks to a network.

export const ITERATIONS = 600000;
export const MIN_PASSPHRASE = 12;
const FORMAT = 'digital-will-backup';

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function unb64(text) {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

async function keyFrom(passphrase, salt, iterations) {
  const material = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function seal(state, passphrase, iterations = ITERATIONS) {
  if (typeof passphrase !== 'string' || passphrase.length < MIN_PASSPHRASE) throw new Error('short');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFrom(passphrase, salt, iterations);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(state)));
  return {
    format: FORMAT, v: 1, kdf: 'PBKDF2-SHA-256', cipher: 'AES-256-GCM', iterations,
    salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(data)),
  };
}

export async function open(envelope, passphrase) {
  if (!envelope || envelope.format !== FORMAT || envelope.v !== 1) throw new Error('format');
  const iterations = Number(envelope.iterations);
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 5000000) throw new Error('format');
  let plain;
  try {
    const key = await keyFrom(String(passphrase), unb64(envelope.salt), iterations);
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(envelope.iv) }, key, unb64(envelope.data));
  } catch {
    throw new Error('passphrase');
  }
  return JSON.parse(dec.decode(plain));
}
